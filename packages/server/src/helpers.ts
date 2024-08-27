// @ts-nocheck
import { networkInterfaces } from 'os'

export function getLocalIp() {
  const nets = networkInterfaces()
  return [...Object.values(nets)]
    .flat()
    .filter(
      (n) =>
        !n.internal &&
        (n.address.startsWith('192.168') ||
          n.address.startsWith('10.') ||
          n.address.startsWith('172.16.') ||
          n.address.startsWith('172.17.') ||
          n.address.startsWith('172.18.') ||
          n.address.startsWith('172.19.') ||
          n.address.startsWith('172.20.') ||
          n.address.startsWith('172.21.') ||
          n.address.startsWith('172.22.') ||
          n.address.startsWith('172.23.') ||
          n.address.startsWith('172.24.') ||
          n.address.startsWith('172.25.') ||
          n.address.startsWith('172.26.') ||
          n.address.startsWith('172.27.') ||
          n.address.startsWith('172.28.') ||
          n.address.startsWith('172.29.') ||
          n.address.startsWith('172.30.') ||
          n.address.startsWith('172.31.'))
    )?.[0]?.address
}
