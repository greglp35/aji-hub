import asyncio
import base64
import hmac
import os
import sys
import time
import uuid
from pathlib import Path

import httpx
from fastapi import HTTPException, Query

root = Path(__file__).resolve().parent
data = "".join((root / f"bundle_part{i}.txt").read_text() for i in range(1, 5))
zip_path = Path("/tmp/aji_backend.zip")
zip_path.write_bytes(base64.b64decode(data))
sys.path.insert(0, str(zip_path))

from app.main import app

@app.get("/__e2e__/idempotency")
async def e2e_idempotency(token: str = Query(...)):
    expected = os.getenv("AJI_E2E_TOKEN", "")
    if not expected or not hmac.compare_digest(token, expected):
        raise HTTPException(status_code=404, detail="Not found")

    user = os.getenv("AJI_BOOTSTRAP_ADMIN_USER", "")
    password = os.getenv("AJI_BOOTSTRAP_ADMIN_PASSWORD", "")
    if not user or not password:
        raise HTTPException(status_code=500, detail="E2E credentials missing")

    transport = httpx.ASGITransport(app=app)
    base = "http://aji-e2e.local"
    async with httpx.AsyncClient(transport=transport, base_url=base, timeout=30.0) as client:
        login = await client.post("/api/v1/auth/login", json={"username": user, "password": password})
        if login.status_code != 200:
            return {"ok": False, "phase": "login", "status": login.status_code, "body": login.text[:500]}

        access = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {access}"}
        nonce = uuid.uuid4().hex[:16]
        entity_id = f"cl-e2e-{nonce}"
        command_id = f"cmd-e2e-{nonce}"
        body = {
            "command_id": command_id,
            "agency_id": "ag-breal",
            "entity_id": entity_id,
            "name": f"E2E Idempotency {nonce}",
            "city": "Rennes",
            "contact_name": "E2E",
            "phone": "",
            "email": ""
        }

        start = time.perf_counter()
        responses = await asyncio.gather(*[
            client.post("/api/v1/business/clients", json=body, headers=headers)
            for _ in range(8)
        ])
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

        statuses = [r.status_code for r in responses]
        payloads = []
        for r in responses:
            try:
                payloads.append(r.json())
            except Exception:
                payloads.append({"raw": r.text[:300]})

        business_statuses = [p.get("status") for p in payloads if isinstance(p, dict)]
        applied = business_statuses.count("APPLIED")
        idempotent = business_statuses.count("IDEMPOTENT")

        listed = await client.get("/api/v1/records/clients", params={"agency_id": "ag-breal"}, headers=headers)
        entity_count = None
        if listed.status_code == 200:
            rows = listed.json()
            entity_count = sum(1 for row in rows if row.get("id") == entity_id)

        reuse = await client.patch(
            f"/api/v1/business/clients/{entity_id}",
            json={
                "command_id": command_id,
                "agency_id": "ag-breal",
                "expected_version": 1,
                "city": "Reuse should fail"
            },
            headers=headers
        )
        reuse_detail = None
        try:
            reuse_detail = reuse.json().get("detail")
        except Exception:
            reuse_detail = reuse.text[:300]

        ok = (
            statuses == [200] * 8
            and applied == 1
            and idempotent == 7
            and entity_count == 1
            and reuse.status_code == 409
            and reuse_detail == "IDEMPOTENCY_KEY_REUSE"
        )

        return {
            "ok": ok,
            "database_dialect_expected": "postgresql",
            "parallel_calls": 8,
            "http_statuses": statuses,
            "applied": applied,
            "idempotent": idempotent,
            "entity_count": entity_count,
            "key_reuse_status": reuse.status_code,
            "key_reuse_detail": reuse_detail,
            "elapsed_ms": elapsed_ms
        }
