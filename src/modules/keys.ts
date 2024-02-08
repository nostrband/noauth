import crypto, { pbkdf2 } from 'crypto'
import { getPublicKey, nip19 } from 'nostr-tools'

// encrypted keys have a prefix and version
// so that we'd be able to switch to a better
// implementation eventually, like when scrypt/argon
// are better supported
const PREFIX = 'noauth'
const PREFIX_LOCAL = 'noauthl'
const VERSION = '1'
const VERSION_LOCAL = '1'

// v1 params
// key derivation
const ITERATIONS = 10000000
const ITERATIONS_PWH = 100000
const HASH_SIZE = 32
const HASH_ALGO = 'sha256'
// encryption
const ALGO = 'aes-256-cbc'
const IV_SIZE = 16

// valid passwords are a limited ASCII only, see notes below
const ASCII_REGEX = /^[A-Za-z0-9!@#$%^&*()]{4,}$/

const ALGO_LOCAL = 'AES-CBC'
const KEY_SIZE_LOCAL = 256

export class Keys {
  subtle: any

  constructor(cryptoSubtle: any) {
    this.subtle = cryptoSubtle
  }

  public isValidPassphase(passphrase: string): boolean {
    return ASCII_REGEX.test(passphrase)
  }

  public async generatePassKey(pubkey: string, passphrase: string): Promise<{ passkey: Buffer; pwh: string }> {
    const salt = Buffer.from(pubkey, 'hex')

    // https://nodejs.org/api/crypto.html#using-strings-as-inputs-to-cryptographic-apis
    // https://github.com/ricmoo/scrypt-js#encoding-notes
    // We could use string.normalize() to make sure all JS implementations
    // are compatible, but since we're looking to make this thing a standard
    // then the simplest way is to exclude unicode and only work with ASCII
    if (!this.isValidPassphase(passphrase)) throw new Error('Password must be 4+ ASCII chars')

    return new Promise((ok, fail) => {
      // NOTE: we should use Argon2 or scrypt later, for now
      // let's start with a widespread and natively-supported pbkdf2
      pbkdf2(passphrase, salt, ITERATIONS, HASH_SIZE, HASH_ALGO, (err, key) => {
        if (err) fail(err)
        else {
          pbkdf2(key, passphrase, ITERATIONS_PWH, HASH_SIZE, HASH_ALGO, (err, hash) => {
            if (err) fail(err)
            else
              ok({
                passkey: key,
                pwh: hash.toString('hex'),
              })
          })
        }
      })
    })
  }

  private isSafari() {
    const chrome = navigator.userAgent.indexOf('Chrome') > -1
    const safari = navigator.userAgent.indexOf('Safari') > -1
    return safari && !chrome
  }

  public async generateLocalKey(): Promise<CryptoKey | {}> {
    // https://github.com/dexie/Dexie.js/issues/585
    // Those lazy-asses from Safari still don't allow one
    // to store keys in IndexedDB, so for them we have to
    // store nsecs in plaintext
    if (this.isSafari()) return {}

    return await this.subtle.generateKey(
      { name: ALGO_LOCAL, length: KEY_SIZE_LOCAL },
      // NOTE: important to make sure it's not visible in
      // dev console in IndexedDB
      /*extractable*/ false,
      ['encrypt', 'decrypt']
    )
  }

  public async encryptKeyLocal(key: string, localKey: CryptoKey | {}): Promise<string> {
    if (this.isSafari()) return key
    const nsec = nip19.nsecEncode(key)
    const iv = crypto.randomBytes(IV_SIZE)
    const encrypted = await this.subtle.encrypt({ name: ALGO_LOCAL, iv }, localKey, Buffer.from(nsec))
    return `${PREFIX_LOCAL}:${VERSION_LOCAL}:${iv.toString('hex')}:${Buffer.from(encrypted).toString('hex')}}`
  }

  public async decryptKeyLocal({ enckey, localKey }: { enckey: string; localKey: CryptoKey | {} }): Promise<string> {
    if (this.isSafari()) return enckey
    const parts = enckey.split(':')
    if (parts.length !== 4) throw new Error('Bad encrypted key')
    if (parts[0] !== PREFIX_LOCAL) throw new Error('Bad encrypted key prefix')
    if (parts[1] !== VERSION_LOCAL) throw new Error('Bad encrypted key version')
    if (parts[2].length !== IV_SIZE * 2) throw new Error('Bad encrypted key iv')
    if (parts[3].length < 30) throw new Error('Bad encrypted key data')
    const iv = Buffer.from(parts[2], 'hex')
    const data = Buffer.from(parts[3], 'hex')
    const decrypted = await this.subtle.decrypt({ name: ALGO_LOCAL, iv }, localKey, data)
    const { type, data: value } = nip19.decode(Buffer.from(decrypted).toString())
    if (type !== 'nsec') throw new Error('Bad encrypted key payload type')
    if ((value as string).length !== 64) throw new Error('Bad encrypted key payload length')
    return value as string
  }

  public async encryptKeyPass({
    key,
    passphrase,
  }: {
    key: string
    passphrase: string
  }): Promise<{ enckey: string; pwh: string }> {
    const start = Date.now()
    const nsec = nip19.nsecEncode(key)
    const pubkey = getPublicKey(key)
    const { passkey, pwh } = await this.generatePassKey(pubkey, passphrase)
    const iv = crypto.randomBytes(IV_SIZE)
    const cipher = crypto.createCipheriv(ALGO, passkey, iv)
    const encrypted = Buffer.concat([cipher.update(nsec), cipher.final()])
    console.log('encrypted key in ', Date.now() - start)
    return {
      enckey: `${PREFIX}:${VERSION}:${iv.toString('hex')}:${encrypted.toString('hex')}`,
      pwh,
    }
  }

  public async decryptKeyPass({
    pubkey,
    enckey,
    passphrase,
  }: {
    pubkey: string
    enckey: string
    passphrase: string
  }): Promise<string> {
    const start = Date.now()
    const parts = enckey.split(':')
    if (parts.length !== 4) throw new Error('Bad encrypted key')
    if (parts[0] !== PREFIX) throw new Error('Bad encrypted key prefix')
    if (parts[1] !== VERSION) throw new Error('Bad encrypted key version')
    if (parts[2].length !== IV_SIZE * 2) throw new Error('Bad encrypted key iv')
    if (parts[3].length < 30) throw new Error('Bad encrypted key data')
    const { passkey } = await this.generatePassKey(pubkey, passphrase)
    const iv = Buffer.from(parts[2], 'hex')
    const data = Buffer.from(parts[3], 'hex')
    const decipher = crypto.createDecipheriv(ALGO, passkey, iv)
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
    const nsec = decrypted.toString()
    const { type, data: value } = nip19.decode(nsec)
    if (type !== 'nsec') throw new Error('Bad encrypted key payload type')
    if (value.length !== 64) throw new Error('Bad encrypted key payload length')
    console.log('decrypted key in ', Date.now() - start)
    return nsec
  }
}
