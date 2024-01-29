import { randomBytes } from '@noble/hashes/utils'
import { secp256k1 } from '@noble/curves/secp256k1'
import { base64 } from '@scure/base'
import { getPublicKey } from 'nostr-tools'

export const utf8Decoder = new TextDecoder('utf-8')
export const utf8Encoder = new TextEncoder()

function toBase64(uInt8Array: Uint8Array) {
  let strChunks = new Array(uInt8Array.length);
  let i = 0;
  // @ts-ignore
  for (let byte of uInt8Array) {
    strChunks[i] = String.fromCharCode(byte); // bytes to utf16 string
    i++;
  }
  return btoa(strChunks.join(""));
}

function fromBase64(base64String: string) {
  const binaryString = atob(base64String);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function getNormalizedX(key: Uint8Array): Uint8Array {
  return key.slice(1, 33)
}

export class Nip04 {
  private cache = new Map<string, CryptoKey>()

  public createKey(privkey: string, pubkey: string) {
    const key = secp256k1.getSharedSecret(privkey, '02' + pubkey)
    const normalizedKey = getNormalizedX(key)
    return normalizedKey
  }

  private async getKey(privkey: string, pubkey: string, extractable?: boolean) {
    const id = getPublicKey(privkey) + pubkey
    let cryptoKey = this.cache.get(id)
    if (cryptoKey) return cryptoKey

    const key = this.createKey(privkey, pubkey)
    cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-CBC' }, !!extractable, ['encrypt', 'decrypt'])
    this.cache.set(id, cryptoKey)
    return cryptoKey
  }

  public async encrypt(privkey: string, pubkey: string, text: string): Promise<string> {
    const t1 = Date.now()
    const cryptoKey = await this.getKey(privkey, pubkey)
    const t2 = Date.now()
    let iv = Uint8Array.from(randomBytes(16))
    let plaintext = utf8Encoder.encode(text)
    let ciphertext = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, plaintext)
    const t3 = Date.now()
    let ctb64 = base64.encode(new Uint8Array(ciphertext))
    let ivb64 = base64.encode(new Uint8Array(iv.buffer))
    // let ctb64 = toBase64(new Uint8Array(ciphertext))
    // let ivb64 = toBase64(new Uint8Array(iv.buffer))

    console.log("nip04_encrypt", text, "t1", t2 - t1, "t2", t3 - t2, "t3", Date.now() - t3)

    return `${ctb64}?iv=${ivb64}`
  }

  public async decrypt(privkey: string, pubkey: string, data: string): Promise<string> {
    let [ctb64, ivb64] = data.split('?iv=')

    const cryptoKey = await this.getKey(privkey, pubkey)

    let ciphertext = base64.decode(ctb64)
    let iv = base64.decode(ivb64)
    // let ciphertext = fromBase64(ctb64)
    // let iv = fromBase64(ivb64)

    let plaintext = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, ciphertext)

    let text = utf8Decoder.decode(plaintext)
    return text
  }

}


