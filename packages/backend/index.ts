export * from './src/backend'
export * from './src/types'
export * from './src/const'
export * from './src/global'
export * from './src/api'
export * from './src/nip04'
export * from './src/nip44'
export * from './src/nip46'
export * from './src/nip49'
export * from './src/pow'
export * from './src/signer'
export * from './src/utils'
export * from './src/watcher'

import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { WebSocketBackend } from './src/websocket'

const server = http.createServer()
export const wss = new WebSocketServer({ noServer: true })

wss.on('connection', (ws, req) => {
  const baseUrl = req.headers.origin || ''
  new WebSocketBackend(ws, baseUrl)
})

server.on('upgrade', (req, socket: any, head: Buffer) => {
  wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
    wss.emit('connection', ws, req)
  })
})

server.listen(8080, () => {
  console.log('Server running on http://localhost:8080/')
})
