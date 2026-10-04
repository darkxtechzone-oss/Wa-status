# WA Status Viewer (flat) + Web Pairing

Bot inafanya kitu kimoja tu: **auto view status** zote. Hakuna commands.

## Faili
- `index.js`  - bot (view status)
- `web.js` + `pair.html` - web page ya pairing code
- `connection.js` - reconnect logic
- `render.yaml`, `package.json`, `.node-version`, `.gitignore`

## Render
1. Weka faili kwenye GitHub repo (root ya repo).
2. Render → New → Web Service → chagua repo (Build: `npm install`, Start: `npm start`).
3. Fungua URL ya service, andika number (mfano `255712345678`), pata code, kisha WhatsApp → Linked devices → Link with phone number.

## Maelezo
- `GET /health` kwa uptime monitor (UptimeRobot kila dakika 5, kwa sababu free plan inalala).
- Session iko kwenye `sessions/` (au `SESSION_DIR`). Kwenye free plan inafutika kila redeploy/restart; kwa session ya kudumu tumia Disk (angalia `render.yaml`).
