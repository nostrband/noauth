export interface Meta {
	name?: string
	picture?: string
	about?: string
	nip05?: string
	lud06?: string
	lud16?: string
	display_name?: string
	website?: string
	banner?: string
	npub?: string
	pubkey?: string
}

export function createMeta(o: object): Meta {
	return o as Meta
}
