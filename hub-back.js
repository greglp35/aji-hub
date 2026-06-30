/**
 * hub-back.js — AJI HUB
 * Bouton retour universel vers aji-hub.html
 * Intégration : <script src="./hub-back.js"></script>  (avant </body>)
 */
(function () {
  const HUB_URL = 'https://greglp35.github.io/aji-hub/';

  const style = document.createElement('style');
  style.textContent = `
    #aji-hub-back {
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 8px 14px;
      background: #111316;
      border: 1px solid #2f333d;
      border-radius: 6px;
      color: #dde1ee;
      font-family: 'Barlow Condensed', 'IBM Plex Mono', 'Courier New', monospace;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-decoration: none;
      text-transform: uppercase;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
      transition: border-color 0.15s, color 0.15s, transform 0.12s;
      user-select: none;
    }
    #aji-hub-back:hover {
      border-color: #f5d10d;
      color: #f5d10d;
      transform: translateY(-1px);
    }
    #aji-hub-back:active {
      transform: translateY(0);
    }
    #aji-hub-back .hub-logo {
      background: #f5d10d;
      color: #000;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 5px;
      border-radius: 3px;
      letter-spacing: 0.5px;
      line-height: 1;
    }
    #aji-hub-back .hub-arrow {
      font-size: 14px;
      line-height: 1;
    }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('a');
  btn.id = 'aji-hub-back';
  btn.href = HUB_URL;
  btn.title = 'Retour au Hub AJI';
  btn.innerHTML = `<span class="hub-arrow">←</span><span class="hub-logo">AJI</span> HUB`;

  document.body.appendChild(btn);
})();
