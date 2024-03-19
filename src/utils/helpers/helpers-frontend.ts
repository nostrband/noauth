import { DbHistory, DbPending } from "@/modules/db"
import { swicCall, swicWaitStarted } from "@/modules/swic"
import { nip19 } from "nostr-tools"

function printPrettyJson(paramsArray: any[]) {
  try {
    const parseParams = paramsArray.map((param) => JSON.parse(param))
    return JSON.stringify(parseParams, null, 3)
  } catch (error) {
    return ''
  }
}

export async function getReqDetails(req: DbPending | DbHistory) {
  try {
    const paramsArray: any[] = JSON.parse(req.params)
    if (req.method === 'sign_event') {
      return printPrettyJson(paramsArray)
    } else if (req.method === 'nip04_decrypt') {
      await swicWaitStarted()
      const text = await swicCall('nip04Decrypt', req.npub, paramsArray[0], paramsArray[1])
      return `Message with ${nip19.npubEncode(paramsArray[0])}: ${text}`
    } else if (req.method === 'nip44_decrypt') {
      await swicWaitStarted()
      const text = await swicCall('nip44Decrypt', req.npub, paramsArray[0], paramsArray[1])
      return `Message (NIP-44) with ${nip19.npubEncode(paramsArray[0])}: ${text}`
    } else if (req.method === 'nip04_encrypt' || req.method === 'nip44_encrypt') {
      return `Message${req.method === 'nip44_encrypt' ? ' (NIP-44) ' : ' '}with ${nip19.npubEncode(paramsArray[0])}: ${paramsArray[1]}`
    } else {
      return ''
    }
  } catch (e) {
    return 'Error: Failed to parse request parameters'
  }
}
