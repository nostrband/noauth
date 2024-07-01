require('websocket-polyfill')
// import { webcrypto } from 'node:crypto'
// // @ts-ignore
// if (!globalThis.crypto) globalThis.crypto = webcrypto

import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { WebSocketBackend } from './src/server'
import { dbi } from '@noauth/common'

const server = http.createServer()
const wss = new WebSocketServer({ noServer: true })
const backend = new WebSocketBackend(wss)

wss.on('connection', (ws, req) => {
  ws.on('message', (msg) => backend.onMessageEvent(ws, msg.toString('utf-8')))
  ws.on('close', backend.onClose.bind(backend))
})

wss.on('re-render', () => {
  wss.clients.forEach((client) => {
    client.send(JSON.stringify({ result: 're-render' }))
  })
})

server.on('upgrade', (req, socket: any, head: Buffer) => {
  wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
    wss.emit('connection', ws, req)
  })
})

// wait until prisma is dynamically imported
async function waitDbi(cb: () => void) {
  if (!dbi) setTimeout(() => waitDbi(cb), 100);
  else cb();
}

waitDbi(() => {
  backend.start();
  server.listen(8080, () => {
    console.log('Server running on http://localhost:8080/')
  })  
})
