// Bot ya auto view status tu. Pairing code inatolewa kupitia web (web.js).
const fs = require('fs')
const path = require('path')
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const web = require('./web')
const { konek } = require('./connection')

const SESSION_DIR = process.env.SESSION_DIR || path.join(__dirname, 'sessions')

process.on('uncaughtException', console.error)
process.on('unhandledRejection', (r) => console.log('Unhandled Rejection:', r))

let baileys
let reconnectTimer = null

const scheduleRestart = (ms = 3000) => {
    if (reconnectTimer) return
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        clientstart()
    }, ms)
}

const clientstart = async () => {
    baileys = baileys || await import('@whiskeysockets/baileys')
    const { default: makeWASocket, Browsers, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        version,
        browser: Browsers.ubuntu('Chrome')
    })

    web.setSock(sock)

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update

        if (connection === 'connecting') console.log('🔄 Connecting to WhatsApp...')

        if (qr) web.markReady(sock) // socket iko tayari kuomba pairing code

        if (connection === 'open') {
            web.setConnected(sock, true)
            console.log('✅ Connected to WhatsApp successfully!')
        }

        if (connection === 'close') {
            web.setConnected(sock, false)
            console.log('❌ Connection closed:', lastDisconnect?.error?.message || lastDisconnect?.error)
            try { sock.ev.removeAllListeners() } catch (e) {}

            const { reconnect, resetSession, delay } = konek({ update, DisconnectReason, Boom })
            if (resetSession) {
                try { fs.rmSync(SESSION_DIR, { recursive: true, force: true }) } catch (e) {}
                console.log('🧹 Session imefutwa. Fungua web page upate pairing code mpya.')
            }
            if (reconnect) scheduleRestart(delay)
        }
    })

    // Logic pekee ya bot: view status zote
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const mek of messages) {
            try {
                if (mek.key?.remoteJid !== 'status@broadcast' || mek.key.fromMe || !mek.message) continue
                await sock.readMessages([mek.key])
            } catch (err) {
                console.log('view status error:', err?.message || err)
            }
        }
    })
}

web.start()
clientstart()
