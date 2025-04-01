import NDK, { NDKEvent, NDKNostrRpc, NDKRelaySet, NDKRpcResponse, NDKSigner } from '@nostr-dev-kit/ndk'
import { Event, getPublicKey, nip44 } from 'nostr-tools'
import { Signer } from './signer'
import { Nip46Client } from './nip46'

const KIND_ENCLAVE = 24135
const KIND_INSTANCE = 63793

export class EnclaveClient {
  private ndk: NDK
  private signer: Signer
  private client: Nip46Client
  private relays: string[]

  constructor(enclave: Event, signer: Signer, relays: string[]) {
    this.relays = enclave.tags.filter((t) => t.length > 1 && t[0] === 'relay').map((t) => t[1])
    if (!this.relays.length) throw new Error('No enclave relays')
    this.ndk = new NDK({
      explicitRelayUrls: relays,
    })
    this.ndk.connect()
    this.signer = signer
    this.client = new Nip46Client({ ndk: this.ndk, kind: KIND_ENCLAVE, signer, signerPubkey: enclave.pubkey })
  }

  public async ping() {
    const pong = await this.client.send({
      method: 'ping',
      params: [],
      timeout: 1000,
    })
    if (pong !== 'pong') throw new Error('Bad pong')
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

  public async importKey(privkey: string) {
    const pubkey = (await this.signer.user()).pubkey
    if (getPublicKey(privkey) !== pubkey) throw new Error('Invalid privkey')
    const ok = await this.client.send({
      method: 'import_key',
      params: [privkey, this.relays.join(',')],
      timeout: 10000,
    })
    if (ok === 'ok') return
    throw new Error('Bad import reply')
  }

  public async deleteKey() {
    const pubkey = (await this.signer.user()).pubkey
    const ok = await this.client.send({
      method: 'delete_key',
      params: [pubkey, this.relays.join(',')],
      timeout: 10000,
    })
    if (ok === 'ok') return
    throw new Error('Bad import reply')
  }
}

export async function fetchEnclaves(ndk: NDK, pubkeys: string[]) {
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
}
