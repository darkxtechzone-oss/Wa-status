// Inaamua nini cha kufanya connection ikifungwa. index.js ndio inafanya reconnect (mara moja tu).
module.exports = {
    konek: ({ update, DisconnectReason, Boom }) => {
        const reason = new Boom(update.lastDisconnect?.error)?.output.statusCode

        if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.badSession) {
            console.log('Session haifai / device imetolewa (logged out). Pair upya kupitia web.')
            return { reconnect: true, resetSession: true, delay: 2000 }
        }
        if (reason === DisconnectReason.connectionReplaced) {
            console.log('Connection replaced: kuna instance nyingine inatumia session hii.')
            return { reconnect: false, resetSession: false, delay: 0 }
        }
        if (reason === DisconnectReason.restartRequired) {
            console.log('Restart required, inaanza upya...')
            return { reconnect: true, resetSession: false, delay: 1000 }
        }
        console.log(`Disconnected (${reason}), inajaribu tena...`)
        return { reconnect: true, resetSession: false, delay: 5000 }
    }
}
