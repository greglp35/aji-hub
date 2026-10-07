import base64, sys
from pathlib import Path
root=Path(__file__).resolve().parent
data="".join((root/f"bundle_part{i}.txt").read_text() for i in range(1,5))
zip_path=Path("/tmp/aji_backend.zip")
zip_path.write_bytes(base64.b64decode(data))
sys.path.insert(0,str(zip_path))
from app.main import app
