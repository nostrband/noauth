import type { UnsignedEvent } from 'nostr-tools'
import { generatePrivateKey, getPublicKey, getSignature } from 'nostr-tools'

import type { NostrEvent } from '@nostr-dev-kit/ndk' // "./ndk-dist";
import { NDKUser } from '@nostr-dev-kit/ndk' // "./ndk-dist";
import type { NDKSigner } from '@nostr-dev-kit/ndk' // "./ndk-dist";
import { Nip04 } from './nip04'
//import { decrypt, encrypt } from "./ende";

export class PrivateKeySigner implements NDKSigner {
	private _user: NDKUser | undefined
	privateKey?: string
	private nip04: Nip04

	public constructor(privateKey?: string) {
		if (privateKey) {
			this.privateKey = privateKey
			this._user = new NDKUser({
				hexpubkey: getPublicKey(this.privateKey),
			})
		}
		this.nip04 = new Nip04()
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

		const recipientHexPubKey = recipient.hexpubkey
		return await this.nip04.encrypt(
			this.privateKey,
			recipientHexPubKey,
			value,
		)
		//        return await encrypt(recipientHexPubKey, value, this.privateKey);
	}

	public async decrypt(sender: NDKUser, value: string): Promise<string> {
		if (!this.privateKey) {
			throw Error('Attempted to decrypt without a private key')
		}

		const senderHexPubKey = sender.hexpubkey
		//        console.log("nip04_decrypt", value)
		return await this.nip04.decrypt(this.privateKey, senderHexPubKey, value)
		//        return await decrypt(this.privateKey, senderHexPubKey, value) as string;
	}
}
