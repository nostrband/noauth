import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { WebSocketBackend } from './src/server'

const server = http.createServer()
export const wss = new WebSocketServer({ noServer: true })

wss.on('connection', (ws, req) => {
  const baseUrl = req.headers.origin || ''
  new WebSocketBackend(ws, baseUrl)
})

wss.on('re-render', (ws, req) => {
  wss.clients.forEach((client) => {
    client.send(JSON.stringify({ result: 're-render' }))
  })
})

server.on('upgrade', (req, socket: any, head: Buffer) => {
  wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
    wss.emit('connection', ws, req)
  })
})

server.listen(8080, () => {
  console.log('Server running on http://localhost:8080/')
})
