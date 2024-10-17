// // @ts-nocheck
// import { networkInterfaces } from 'os'
import { exec } from 'child_process'
import { ORIGIN, PORT } from './consts'

export async function getOrigin() {
  if (ORIGIN) {
    if (ORIGIN.endsWith("/")) return ORIGIN.substring(0, ORIGIN.length - 1);
    return ORIGIN;
  }

  const ip = await getLocalIp();
  return `http://${ip}:${PORT}`
}

async function getLocalIp() {
  return new Promise((ok, err) => {
    exec("ip route show | awk '/default/ {print $3}'", (error, stdout, stderr) => {
      if (error) {
        // node couldn't execute the command
        console.log(`stderr: ${stderr}`)
        err(error)
      } else {
        // the *entire* stdout and stderr (buffered)
        const ip = stdout.trim()
        console.log(`local ip: "${ip}"`)
        ok(ip)
      }
    })
  })

  // const nets = networkInterfaces()
  // console.log("nets", nets);
  // return [...Object.values(nets)]
  //   .flat()
  //   .filter(
  //     (n) =>
  //       !n.internal &&
  //       (n.address.startsWith('192.168') ||
  //         n.address.startsWith('10.') ||
  //         n.address.startsWith('172.16.') ||
  //         n.address.startsWith('172.17.') ||
  //         n.address.startsWith('172.18.') ||
  //         n.address.startsWith('172.19.') ||
  //         n.address.startsWith('172.20.') ||
  //         n.address.startsWith('172.21.') ||
  //         n.address.startsWith('172.22.') ||
  //         n.address.startsWith('172.23.') ||
  //         n.address.startsWith('172.24.') ||
  //         n.address.startsWith('172.25.') ||
  //         n.address.startsWith('172.26.') ||
  //         n.address.startsWith('172.27.') ||
  //         n.address.startsWith('172.28.') ||
  //         n.address.startsWith('172.29.') ||
  //         n.address.startsWith('172.30.') ||
  //         n.address.startsWith('172.31.'))
  //   )?.[0]?.address
}
