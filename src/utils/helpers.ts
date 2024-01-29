import { nip19 } from 'nostr-tools'
import { ACTION_TYPE, NIP46_RELAYS } from './consts'
import { DbPending } from '@/modules/db'

export async function log(s: string) {
	const log = document.getElementById('log')
	if (log) log.innerHTML = s
}

export async function call(cb: () => any) {
	try {
		return await cb()
	} catch (e) {
		console.log(`Error: ${e}`)
	}
}

export const getShortenNpub = (npub = '') => {
	return npub.substring(0, 10) + '...' + npub.slice(-4)
}

export const getBunkerLink = (npub = '') => {
	if (!npub) return ''
	const { data: pubkey } = nip19.decode(npub)
	return `bunker://${pubkey}?relay=${NIP46_RELAYS[0]}`
}

export async function askNotificationPermission() {
	return new Promise<void>((ok, rej) => {
		// Let's check if the browser supports notifications
		if (!('Notification' in window)) {
			log('This browser does not support notifications.')
			rej()
		} else {
			Notification.requestPermission().then(() => {
				log('notifications perm' + Notification.permission)
				if (Notification.permission === 'granted') ok()
				else rej()
			})
		}
	})
}

export function getSignReqKind(req: DbPending): number | undefined {
	try {
		const data = JSON.parse(JSON.parse(req.params)[0])
		return data.kind
	} catch {}
	return undefined
}

export function getReqPerm(req: DbPending): string {
	if (req.method === 'sign_event') {
		const kind = getSignReqKind(req)
		if (kind !== undefined)
			return `${req.method}:${kind}`
	}
	return req.method
}

export function isPackagePerm(perm: string, reqPerm: string) {
	if (perm === ACTION_TYPE.BASIC.toLowerCase()) {
		switch (reqPerm) {
			case 'get_public_key':
			case 'nip04_decrypt':
			case 'nip04_encrypt':
			case 'sign_event:0':
			case 'sign_event:1':
			case 'sign_event:3':
			case 'sign_event:6':
			case 'sign_event:7':
			case 'sign_event:9734':
			case 'sign_event:10002':
			case 'sign_event:30023':
			case 'sign_event:10000':
				return true
		}
	}
	return false
}
