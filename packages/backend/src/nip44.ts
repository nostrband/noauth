import { chacha20 } from '@noble/ciphers/chacha'
import { concatBytes, randomBytes, utf8ToBytes } from '@noble/hashes/utils'
import { equalBytes } from '@noble/ciphers/utils'
import { secp256k1 } from '@noble/curves/secp256k1'
import { expand as hkdf_expand, extract as hkdf_extract } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha256'
import { hmac } from '@noble/hashes/hmac'
import { base64 } from '@scure/base'

import { NDKUser } from '@nostr-dev-kit/ndk'
import { getPublicKey } from 'nostr-tools'
import { IEventHandlingStrategyOptioned, Nip46Backend } from './nip46'

// from https://github.com/nbd-wtf/nostr-tools

const decoder = new TextDecoder()

const u = {
  minPlaintextSize: 0x0001, // 1b msg => padded to 32b
  maxPlaintextSize: 0xffff, // 65535 (64kb-1) => padded to 64kb

  utf8Encode: utf8ToBytes,
  utf8Decode(bytes: Uint8Array): string {
    return decoder.decode(bytes)
  },

  getConversationKey(privkeyA: string, pubkeyB: string): Uint8Array {
    const sharedX = secp256k1.getSharedSecret(privkeyA, '02' + pubkeyB).subarray(1, 33)
    return hkdf_extract(sha256, sharedX, 'nip44-v2')
  },

  getMessageKeys(conversationKey: Uint8Array, nonce: Uint8Array) {
    const keys = hkdf_expand(sha256, conversationKey, nonce, 76)
    return {
      chacha_key: keys.subarray(0, 32),
      chacha_nonce: keys.subarray(32, 44),
      hmac_key: keys.subarray(44, 76),
    }
  },

  calcPaddedLen(len: number): number {
    if (!Number.isSafeInteger(len) || len < 1) throw new Error('expected positive integer')
    if (len <= 32) return 32
    const nextPower = 1 << (Math.floor(Math.log2(len - 1)) + 1)
    const chunk = nextPower <= 256 ? 32 : nextPower / 8
    return chunk * (Math.floor((len - 1) / chunk) + 1)
  },

  writeU16BE(num: number): Uint8Array {
    if (!Number.isSafeInteger(num) || num < u.minPlaintextSize || num > u.maxPlaintextSize)
      throw new Error('invalid plaintext size: must be between 1 and 65535 bytes')
    const arr = new Uint8Array(2)
    new DataView(arr.buffer).setUint16(0, num, false)
    return arr
  },

  pad(plaintext: string): Uint8Array {
    const unpadded = u.utf8Encode(plaintext)
    const unpaddedLen = unpadded.length
    const prefix = u.writeU16BE(unpaddedLen)
    const suffix = new Uint8Array(u.calcPaddedLen(unpaddedLen) - unpaddedLen)
    return concatBytes(prefix, unpadded, suffix)
  },

  unpad(padded: Uint8Array): string {
    const unpaddedLen = new DataView(padded.buffer).getUint16(0)
    const unpadded = padded.subarray(2, 2 + unpaddedLen)
    if (
      unpaddedLen < u.minPlaintextSize ||
      unpaddedLen > u.maxPlaintextSize ||
      unpadded.length !== unpaddedLen ||
      padded.length !== 2 + u.calcPaddedLen(unpaddedLen)
    )
      throw new Error('invalid padding')
    return u.utf8Decode(unpadded)
  },

  hmacAad(key: Uint8Array, message: Uint8Array, aad: Uint8Array): Uint8Array {
    if (aad.length !== 32) throw new Error('AAD associated data must be 32 bytes')
    const combined = concatBytes(aad, message)
    return hmac(sha256, key, combined)
  },

  // metadata: always 65b (version: 1b, nonce: 32b, max: 32b)
  // plaintext: 1b to 0xffff
  // padded plaintext: 32b to 0xffff
  // ciphertext: 32b+2 to 0xffff+2
  // raw payload: 99 (65+32+2) to 65603 (65+0xffff+2)
  // compressed payload (base64): 132b to 87472b
  decodePayload(payload: string): {
    nonce: Uint8Array
    ciphertext: Uint8Array
    mac: Uint8Array
  } {
    if (typeof payload !== 'string') throw new Error('payload must be a valid string')
    const plen = payload.length
    if (plen < 132 || plen > 87472) throw new Error('invalid payload length: ' + plen)
    if (payload[0] === '#') throw new Error('unknown encryption version')
    let data: Uint8Array
    try {
      data = base64.decode(payload)
    } catch (error) {
      throw new Error('invalid base64: ' + (error as Error).message)
    }
    const dlen = data.length
    if (dlen < 99 || dlen > 65603) throw new Error('invalid data length: ' + dlen)
    const vers = data[0]
    if (vers !== 2) throw new Error('unknown encryption version ' + vers)
    return {
      nonce: data.subarray(1, 33),
      ciphertext: data.subarray(33, -32),
      mac: data.subarray(-32),
    }
  },
}

export function encryptNip44(
  plaintext: string,
  conversationKey: Uint8Array,
  nonce: Uint8Array = randomBytes(32)
): string {
  const { chacha_key, chacha_nonce, hmac_key } = u.getMessageKeys(conversationKey, nonce)
  const padded = u.pad(plaintext)
  const ciphertext = chacha20(chacha_key, chacha_nonce, padded)
  const mac = u.hmacAad(hmac_key, ciphertext, nonce)
  return base64.encode(concatBytes(new Uint8Array([2]), nonce, ciphertext, mac))
}

export function decryptNip44(payload: string, conversationKey: Uint8Array): string {
  const { nonce, ciphertext, mac } = u.decodePayload(payload)
  const { chacha_key, chacha_nonce, hmac_key } = u.getMessageKeys(conversationKey, nonce)
  const calculatedMac = u.hmacAad(hmac_key, ciphertext, nonce)
  if (!equalBytes(calculatedMac, mac)) throw new Error('invalid MAC')
  const padded = chacha20(chacha_key, chacha_nonce, ciphertext)
  return u.unpad(padded)
}

export class Nip44 {
  private cache = new Map<string, Uint8Array>()

  public createKey(privkey: string, pubkey: string) {
    return u.getConversationKey(privkey, pubkey)
  }

  private getKey(privkey: string, pubkey: string, extractable?: boolean) {
    const id = getPublicKey(privkey) + pubkey
    let cryptoKey = this.cache.get(id)
    if (cryptoKey) return cryptoKey

    const key = this.createKey(privkey, pubkey)
    this.cache.set(id, key)
    return key
  }

  public encrypt(privkey: string, pubkey: string, text: string): string {
    const key = this.getKey(privkey, pubkey)
    return encryptNip44(text, key)
  }

  public decrypt(privkey: string, pubkey: string, data: string): string {
    const key = this.getKey(privkey, pubkey)
    return decryptNip44(data, key)
  }
}

export class Nip44EncryptHandlingStrategy implements IEventHandlingStrategyOptioned {
  async handle(
    backend: Nip46Backend,
    id: string,
    remotePubkey: string,
    params: string[],
    options?: any
  ): Promise<string | undefined> {
    const [recipientPubkey, payload] = params
    const recipientUser = new NDKUser({ hexpubkey: recipientPubkey })

    // our implementation of pubkeyAllowed is noop,
    // and 'method' enum doesn't accept nip44 names,
    // so we just drop this, improve if/when we reimplement
    // nip46 (bcs we've almost done it already, and ndk has issues)
    // if (
    //   !(await backend.pubkeyAllowed({
    //     id,
    //     pubkey: remotePubkey,
    //     method: 'encrypt',
    //     params: payload,
    //   }))
    // ) {
    //   backend.debug(`encrypt request from ${remotePubkey} rejected`)
    //   return undefined
    // }

    return await backend.signer.encryptNip44(recipientUser, payload)
  }
}

export class Nip44DecryptHandlingStrategy implements IEventHandlingStrategyOptioned {
  async handle(
    backend: Nip46Backend,
    id: string,
    remotePubkey: string,
    params: string[],
    options?: any
  ): Promise<string | undefined> {
    const [senderPubkey, payload] = params
    const senderUser = new NDKUser({ hexpubkey: senderPubkey })

    // see notes above
    // if (
    //   !(await backend.pubkeyAllowed({
    //     id,
    //     pubkey: remotePubkey,
    //     method: 'decrypt',
    //     params: payload,
    //   }))
    // ) {
    //   backend.debug(`decrypt request from ${remotePubkey} rejected`)
    //   return undefined
    // }

    return await backend.signer.decryptNip44(senderUser, payload)
  }
}
