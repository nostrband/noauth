import type { UnsignedEvent } from 'nostr-tools'
import { generatePrivateKey, getPublicKey, getSignature } from 'nostr-tools'

import type { NostrEvent } from '@nostr-dev-kit/ndk'
import { NDKUser } from '@nostr-dev-kit/ndk'
import type { NDKSigner } from '@nostr-dev-kit/ndk'
import { Nip04 } from './nip04'
import { Nip44 } from './nip44'

export interface Signer extends NDKSigner {
  encryptNip44(recipient: NDKUser, value: string): Promise<string>
  decryptNip44(sender: NDKUser, value: string): Promise<string>
}

export class PrivateKeySigner implements Signer {
  private _user: NDKUser | undefined
  privateKey?: string
  private nip04: Nip04
  private nip44: Nip44

  public constructor(privateKey?: string) {
    if (privateKey) {
      this.privateKey = privateKey
      this._user = new NDKUser({
        pubkey: getPublicKey(this.privateKey),
      })
    }
    this.nip04 = new Nip04()
    this.nip44 = new Nip44()
  }

  public static generate() {
    const privateKey = generatePrivateKey()
    return new PrivateKeySigner(privateKey)
  }

  public async blockUntilReady(): Promise<NDKUser> {
    if (!this._user) {
      throw new Error('NDKUser not initialized')
    }
    return this._user
  }

  public async user(): Promise<NDKUser> {
    await this.blockUntilReady()
    return this._user as NDKUser
  }

  public async sign(event: NostrEvent): Promise<string> {
    if (!this.privateKey) {
      throw Error('Attempted to sign without a private key')
    }

    return getSignature(event as UnsignedEvent, this.privateKey)
  }

  public async encrypt(recipient: NDKUser, value: string): Promise<string> {
    if (!this.privateKey) {
      throw Error('Attempted to encrypt without a private key')
    }

    const recipientHexPubKey = recipient.pubkey
    return await this.nip04.encrypt(this.privateKey, recipientHexPubKey, value)
  }

  public async decrypt(sender: NDKUser, value: string): Promise<string> {
    if (!this.privateKey) {
      throw Error('Attempted to decrypt without a private key')
    }

    const senderHexPubKey = sender.pubkey
    return await this.nip04.decrypt(this.privateKey, senderHexPubKey, value)
  }

  public async encryptNip44(recipient: NDKUser, value: string): Promise<string> {
    if (!this.privateKey) {
      throw Error('Attempted to encrypt without a private key')
    }

    const recipientHexPubKey = recipient.pubkey
    return await this.nip44.encrypt(this.privateKey, recipientHexPubKey, value)
  }

  public async decryptNip44(sender: NDKUser, value: string): Promise<string> {
    if (!this.privateKey) {
      throw Error('Attempted to decrypt without a private key')
    }

    const senderHexPubKey = sender.pubkey
    return await this.nip44.decrypt(this.privateKey, senderHexPubKey, value)
  }
}
