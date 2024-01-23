import { nip19 } from 'nostr-tools'
import { NIP46_RELAYS } from './consts'

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
	return npub.substring(0, 10) + '...' + npub.slice(-6)
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
