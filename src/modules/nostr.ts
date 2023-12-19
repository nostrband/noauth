import NDK from '@nostr-dev-kit/ndk'

export const ndk = new NDK({
	explicitRelayUrls: ['wss://relay.nostr.band/all'],
})

export async function fetchProfile(pubkey: string) {
	const event = await ndk.fetchEvent({ kinds: [0], authors: [pubkey] })

	if (event) {
		return {
			...event,
			info: JSON.parse(event.content),
		}
	}
	return event
}
