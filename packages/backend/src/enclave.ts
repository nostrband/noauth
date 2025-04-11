import NDK, { NDKEvent, NDKRelaySet } from '@nostr-dev-kit/ndk'
import { Event, getPublicKey } from 'nostr-tools'
import { Signer } from './signer'
import { Nip46Client } from './nip46'
import { GlobalContext } from './global'
import { validateInstance } from 'nostr-enclaves'

const KIND_ENCLAVE = 24135
const KIND_INSTANCE = 63793

export class EnclaveClient {
  private ndk: NDK
  private signer: Signer
  private client: Nip46Client

  constructor(enclavePubkey: string, enclaveRelays: string[], signer: Signer) {
    this.ndk = new NDK({
      explicitRelayUrls: enclaveRelays,
    })
    this.ndk.connect()
    this.signer = signer
    this.client = new Nip46Client({ ndk: this.ndk, kind: KIND_ENCLAVE, signer, signerPubkey: enclavePubkey })
  }

  public dispose() {
    this.client.dispose()
  }

  public async ping(timeout = 1000) {
    const start = Date.now();
    const pong = await this.client.send({
      method: 'ping',
      params: [],
      timeout,
    })
    if (pong !== 'pong') throw new Error('Bad pong')
    return Date.now() - start;
  }

  public async hasKey() {
    const pubkey = (await this.signer.user()).pubkey
    return (
      (await this.client.send({
        method: 'has_key',
        params: [pubkey],
        timeout: 1000,
      })) === 'true'
    )
  }

  public async importKey(privkey: string, relays: string[]) {
    const pubkey = (await this.signer.user()).pubkey
    if (getPublicKey(privkey) !== pubkey) throw new Error('Invalid privkey')
    const ok = await this.client.send({
      method: 'import_key',
      params: [privkey, relays.join(',')],
      timeout: 10000,
    })
    if (ok === 'ok') return
    throw new Error('Bad import reply')
  }

  public async deleteKey() {
    const pubkey = (await this.signer.user()).pubkey
    const ok = await this.client.send({
      method: 'delete_key',
      params: [pubkey],
      timeout: 10000,
    })
    if (ok === 'ok') return
    throw new Error('Bad import reply')
  }
}

export async function fetchEnclaves(ndk: NDK, global: GlobalContext, enclaveEvent?: string) {
  const pubkeys = global.getEnclaveBuilderPubkeys()

  const events = await ndk.fetchEvents(
    {
      // @ts-ignore
      kinds: [KIND_INSTANCE],
      '#p': pubkeys,
      since: Math.floor(Date.now() / 1000) - 3 * 3600,
    },
    {},
    NDKRelaySet.fromRelayUrls(
      [
        // FIXME use outbox relays of ENCLAVE_PUBKEYS
        'wss://relay.primal.net',
        'wss://relay.damus.io',
        'wss://relay.nostr.band/all',
      ],
      ndk
    )
  )
  const uniq = new Map<string, NDKEvent>()
  for (const e of events) {
    const o = uniq.get(e.pubkey)
    if (!o || o.created_at! < e.created_at!) uniq.set(e.pubkey, e)
  }
  return [...uniq.values()]
    .map((e) => e.rawEvent())
    .filter((enc) => {
      const buildSignature = JSON.parse(enc.tags.find((t) => t.length > 1 && t[0] === 'build')?.[1] || '')
      if (!global.getEnclaveBuilderPubkeys().includes(buildSignature.pubkey)) return false

      // verify attestation
      try {
        validateInstance(enc as Event)
      } catch (e) {
        console.log('Invalid enclave', enc, e)
        return false
      }

      const pcrs = new Map<number, string>()
      enc.tags
        .filter((t) => t.length > 2 && t[0] === 'x' && t[2].startsWith('PCR'))
        .map((t) => pcrs.set(Number(t[2].substring(3)), t[1]))
      console.log('pcrs', pcrs)
      return global.isValidEnclavePCRs(pcrs)
    })
}
