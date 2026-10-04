// Web page ya pairing code. Mtu anaandika number -> code inaonekana chini.
const http = require('http')
const fs = require('fs')
const path = require('path')

const state = { sock: null, ready: false, connected: false, lastPair: 0 }

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const isRegistered = () => !!state.sock?.authState?.creds?.registered

function setSock(sock) {
    state.sock = sock
    state.ready = false
    state.connected = false
}
function markReady(sock) { if (sock === state.sock) state.ready = true }
function setConnected(sock, v) { if (sock === state.sock) state.connected = v }

function send(res, code, body, type = 'application/json') {
    res.writeHead(code, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store' })
    res.end(typeof body === 'string' ? body : JSON.stringify(body))
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = ''
        req.on('data', c => { data += c; if (data.length > 2000) { req.destroy(); reject(new Error('too large')) } })
        req.on('end', () => { try { resolve(JSON.parse(data || '{}')) } catch (e) { reject(e) } })
        req.on('error', reject)
    })
}

async function handlePair(req, res) {
    let body
    try { body = await readBody(req) } catch { return send(res, 400, { error: 'Request si sahihi' }) }

    const number = String(body.number || '').replace(/\D/g, '')
    if (number.length < 8 || number.length > 15) {
        return send(res, 400, { error: 'Weka number sahihi pamoja na country code, mfano 255712345678' })
    }
    if (!state.sock) return send(res, 503, { error: 'Bot inaanza, jaribu tena baada ya sekunde chache' })
    if (isRegistered()) return send(res, 409, { error: 'Bot tayari imeunganishwa na WhatsApp' })

    const now = Date.now()
    if (now - state.lastPair < 5000) return send(res, 429, { error: 'Subiri sekunde chache kisha jaribu tena' })
    state.lastPair = now

    // subiri socket iwe tayari (qr event)
    const sock = state.sock
    for (let i = 0; i < 50 && !(state.ready && state.sock === sock); i++) await sleep(500)
    if (!state.ready) return send(res, 503, { error: 'Bado inaunganisha na WhatsApp, jaribu tena' })

    try {
        const raw = await sock.requestPairingCode(number)
        const code = String(raw).match(/.{1,4}/g)?.join('-') || raw
        console.log('🔑 Pairing code imetolewa kwa', number)
        return send(res, 200, { code })
    } catch (e) {
        console.log('Pairing error:', e?.message || e)
        return send(res, 500, { error: 'Imeshindwa kutoa code. Hakikisha number ni sahihi kisha jaribu tena.' })
    }
}

function start() {
    const port = process.env.PORT || 3000
    const server = http.createServer(async (req, res) => {
        const url = (req.url || '/').split('?')[0]
        if (req.method === 'GET' && (url === '/' || url === '/pair')) {
            try { return send(res, 200, fs.readFileSync(path.join(__dirname, 'pair.html'), 'utf8'), 'text/html') }
            catch { return send(res, 500, 'pair.html haipo', 'text/plain') }
        }
        if (req.method === 'GET' && url === '/health') return send(res, 200, 'ok', 'text/plain')
        if (req.method === 'GET' && url === '/api/status') {
            return send(res, 200, { registered: isRegistered(), connected: state.connected, ready: state.ready })
        }
        if (req.method === 'POST' && url === '/api/pair') return handlePair(req, res)
        send(res, 404, { error: 'Not found' })
    })
    server.listen(port, '0.0.0.0', () => console.log('🌐 Web pairing page iko kwenye port', port))
    return server
}

module.exports = { start, setSock, markReady, setConnected }
