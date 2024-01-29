import { generatePrivateKey, getPublicKey, nip19 } from 'nostr-tools'
import { dbi, DbKey, DbPending, DbPerm } from './db'
import { Keys } from './keys'
import NDK, {
	IEventHandlingStrategy,
	NDKEvent,
	NDKNip46Backend,
	NDKPrivateKeySigner,
	NDKSigner,
} from '@nostr-dev-kit/ndk'
import { NOAUTHD_URL, WEB_PUSH_PUBKEY, NIP46_RELAYS } from '../utils/consts'
import { Nip04 } from './nip04'
import { getReqPerm, isPackagePerm } from '@/utils/helpers'
//import { PrivateKeySigner } from './signer'

//const PERF_TEST = false

export interface KeyInfo {
	npub: string
	nip05?: string
	locked: boolean
}

interface Key {
	npub: string
	ndk: NDK
	backoff: number
	signer: NDKSigner
	backend: NDKNip46Backend
}

interface Pending {
	req: DbPending
	cb: (allow: boolean, remember: boolean, options?: any) => void
}

interface IAllowCallbackParams {
	npub: string
	id: string
	method: string
	remotePubkey: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	params?: any
}

class Nip04KeyHandlingStrategy implements IEventHandlingStrategy {
	private privkey: string
	private nip04 = new Nip04()

	constructor(privkey: string) {
		this.privkey = privkey
	}

	private async getKey(
		backend: NDKNip46Backend,
		id: string,
		remotePubkey: string,
		recipientPubkey: string,
	) {
		if (
			!(await backend.pubkeyAllowed({
				id,
				pubkey: remotePubkey,
				// @ts-ignore
				method: 'get_nip04_key',
				params: recipientPubkey,
			}))
		) {
			backend.debug(`get_nip04_key request from ${remotePubkey} rejected`)
			return undefined
		}

		return Buffer.from(
			this.nip04.createKey(this.privkey, recipientPubkey),
		).toString('hex')
	}

	async handle(
		backend: NDKNip46Backend,
		id: string,
		remotePubkey: string,
		params: string[],
	) {
		const [recipientPubkey] = params
		return await this.getKey(backend, id, remotePubkey, recipientPubkey)
	}
}

class EventHandlingStrategyWrapper implements IEventHandlingStrategy {
	readonly npub: string
	readonly method: string
	private body: IEventHandlingStrategy
	private allowCb: (params: IAllowCallbackParams) => Promise<boolean>

	constructor(
		npub: string,
		method: string,
		body: IEventHandlingStrategy,
		allowCb: (params: IAllowCallbackParams) => Promise<boolean>,
	) {
		this.npub = npub
		this.method = method
		this.body = body
		this.allowCb = allowCb
	}

	async handle(
		backend: NDKNip46Backend,
		id: string,
		remotePubkey: string,
		params: string[],
	): Promise<string | undefined> {
		console.log(Date.now(), 'handle', {
			method: this.method,
			id,
			remotePubkey,
			params,
		})
		const allow = await this.allowCb({
			npub: this.npub,
			id,
			method: this.method,
			remotePubkey,
			params,
		})
		if (!allow) return undefined
		return this.body.handle(backend, id, remotePubkey, params).then((r) => {
			console.log(
				Date.now(),
				'req',
				id,
				'method',
				this.method,
				'result',
				r,
			)
			return r
		})
	}
}


export class NoauthBackend {
	readonly swg: ServiceWorkerGlobalScope
	private keysModule: Keys
	private enckeys: DbKey[] = []
	private keys: Key[] = []
	private perms: DbPerm[] = []
	private doneReqIds: string[] = []
	private confirmBuffer: Pending[] = []
	private accessBuffer: DbPending[] = []
	private notifCallback: (() => void) | null = null

	public constructor(swg: ServiceWorkerGlobalScope) {
		this.swg = swg
		this.keysModule = new Keys(swg.crypto.subtle)

		const self = this
		swg.addEventListener('activate', (event) => {
			console.log('activate')
		})

		swg.addEventListener('install', (event) => {
			console.log('install')
		})

		swg.addEventListener('push', (event) => {
			console.log('got push', event)
			self.onPush(event)
			event.waitUntil(
				new Promise((ok: any) => {
					self.setNotifCallback(ok)
				}),
			)
		})

		swg.addEventListener('message', (event) => {
			self.onMessage(event)
		})

		swg.addEventListener(
			'notificationclick',
			(event) => {
				event.notification.close()
				if (event.action.startsWith('allow:')) {
					self.confirm(event.action.split(':')[1], true, false)
				} else if (event.action.startsWith('allow-remember:')) {
					self.confirm(event.action.split(':')[1], true, true)
				} else if (event.action.startsWith('disallow:')) {
					self.confirm(event.action.split(':')[1], false, false)
				} else {
					event.waitUntil(
						self.swg.clients
							.matchAll({ type: 'window' })
							.then((clientList) => {
								console.log('clients', clientList.length)
								for (const client of clientList) {
									console.log('client', client.url)
									if (
										new URL(client.url).pathname === '/' &&
										'focus' in client
									)
										return client.focus()
								}
								// if (self.swg.clients.openWindow)
								//   return self.swg.clients.openWindow("/");
							}),
					)
				}
			},
			false, // ???
		)
	}

	public async start() {
		this.enckeys = await dbi.listKeys()
		console.log('started encKeys', this.listKeys())
		this.perms = await dbi.listPerms()
		console.log('started perms', this.perms)

		const sub = await this.swg.registration.pushManager.getSubscription()

		for (const k of this.enckeys) {
			await this.unlock(k.npub)

			// ensure we're subscribed on the server
			if (sub) await this.sendSubscriptionToServer(k.npub, sub)
		}
	}

	public setNotifCallback(cb: () => void) {
		if (this.notifCallback) {
			this.notify()
		}
		this.notifCallback = cb
	}

	public listKeys(): KeyInfo[] {
		return this.enckeys.map<KeyInfo>((k) => this.keyInfo(k))
	}

	public isLocked(npub: string): boolean {
		return !this.keys.find((k) => k.npub === npub)
	}

	public hasKey(npub: string): boolean {
		return !!this.enckeys.find((k) => k.npub === npub)
	}

	private async sha256(s: string) {
		return Buffer.from(
			await this.swg.crypto.subtle.digest('SHA-256', Buffer.from(s)),
		).toString('hex')
	}

	private async sendPost({
		url,
		method,
		headers,
		body,
	}: {
		url: string
		method: string
		headers: any
		body: string
	}) {
		const r = await fetch(url, {
			method,
			headers: {
				'Content-Type': 'application/json',
				...headers,
			},
			body,
		})
		if (r.status !== 200 && r.status !== 201) {
			console.log('Fetch error', url, method, r.status)
			throw new Error('Failed to fetch' + url)
		}

		return await r.json()
	}

	private async sendPostAuthd({
		npub,
		url,
		method = 'GET',
		body = '',
	}: {
		npub: string
		url: string
		method: string
		body: string
	}) {
		const { data: pubkey } = nip19.decode(npub)

		const key = this.keys.find((k) => k.npub === npub)
		if (!key) throw new Error('Unknown key')

		const authEvent = new NDKEvent(key.ndk, {
			pubkey: pubkey as string,
			kind: 27235,
			created_at: Math.floor(Date.now() / 1000),
			content: '',
			tags: [
				['u', url],
				['method', method],
			],
		})
		if (body) authEvent.tags.push(['payload', await this.sha256(body)])

		authEvent.sig = await authEvent.sign(key.signer)

		const auth = this.swg.btoa(JSON.stringify(authEvent.rawEvent()))

		return await this.sendPost({
			url,
			method,
			headers: {
				Authorization: `Nostr ${auth}`,
			},
			body,
		})
	}

	private async sendSubscriptionToServer(
		npub: string,
		pushSubscription: PushSubscription,
	) {
		const body = JSON.stringify({
			npub,
			relays: NIP46_RELAYS,
			pushSubscription,
		})

		const method = 'POST'
		const url = `${NOAUTHD_URL}/subscribe`

		return this.sendPostAuthd({
			npub,
			url,
			method,
			body,
		})
	}
	private async sendKeyToServer(npub: string, enckey: string, pwh: string) {
		const body = JSON.stringify({
			npub,
			data: enckey,
			pwh,
		})

		const method = 'POST'
		const url = `${NOAUTHD_URL}/put`

		return this.sendPostAuthd({
			npub,
			url,
			method,
			body,
		})
	}

	private async fetchKeyFromServer(npub: string, pwh: string) {
		const body = JSON.stringify({
			npub,
			pwh,
		})

		const method = 'POST'
		const url = `${NOAUTHD_URL}/get`

		return await this.sendPost({
			url,
			method,
			headers: {},
			body,
		})
	}

	private notify() {
		// FIXME collect info from accessBuffer and confirmBuffer
		// and update the notifications

		for (const r of this.confirmBuffer) {
			const text = `Confirm "${r.req.method}" by "${r.req.appNpub}"`
			this.swg.registration.showNotification('Signer access', {
				body: text,
				tag: 'confirm-' + r.req.appNpub,
				actions: [
					{
						action: 'allow:' + r.req.id,
						title: 'Yes',
					},
					{
						action: 'disallow:' + r.req.id,
						title: 'No',
					},
				],
			})
		}

		if (this.notifCallback) this.notifCallback()
	}

	private keyInfo(k: DbKey): KeyInfo {
		return {
			npub: k.npub,
			nip05: k.nip05,
			locked: this.isLocked(k.npub),
		}
	}

	private async generateGoodKey(): Promise<string> {
		return generatePrivateKey()
	}

	public async addKey(nsec?: string): Promise<KeyInfo> {
		let sk = ''
		if (nsec) {
			const { type, data } = nip19.decode(nsec)
			if (type !== 'nsec') throw new Error('Bad nsec')
			sk = data
		} else {
			sk = await this.generateGoodKey()
		}
		const pubkey = getPublicKey(sk)
		const npub = nip19.npubEncode(pubkey)
		const localKey = await this.keysModule.generateLocalKey()
		const enckey = await this.keysModule.encryptKeyLocal(sk, localKey)
		// @ts-ignore
		const dbKey: DbKey = { npub, enckey, localKey }
		await dbi.addKey(dbKey)
		this.enckeys.push(dbKey)
		await this.startKey({ npub, sk })

		const sub = await this.swg.registration.pushManager.getSubscription()
		if (sub) await this.sendSubscriptionToServer(npub, sub)

		return this.keyInfo(dbKey)
	}

	private getPerm(req: DbPending): string {
		const reqPerm = getReqPerm(req)
		const appPerms = this.perms.filter(
			(p) =>
				p.npub === req.npub &&
				p.appNpub === req.appNpub
		)

		// exact match first
		let perm = appPerms.find((p) => p.perm === reqPerm)
		// non-exact next
		if (!perm)
			perm = appPerms.find((p) => isPackagePerm(p.perm, reqPerm))

		console.log("req", req, "perm", reqPerm, "value", perm, appPerms);
		return perm?.value || ''
	}

	private async allowPermitCallback({
		npub,
		id,
		method,
		remotePubkey,
		params,
	}: IAllowCallbackParams): Promise<boolean> {
		// same reqs usually come on reconnects
		if (this.doneReqIds.includes(id)) {
			console.log('request already done', id)
			// FIXME maybe repeat the reply, but without the Notification?
			return false
		}

		const appNpub = nip19.npubEncode(remotePubkey)
		const req: DbPending = {
			id,
			npub,
			appNpub,
			method,
			params: JSON.stringify(params),
			timestamp: Date.now(),
		}

		const self = this
		return new Promise(async (ok) => {
			// called when it's decided whether to allow this or not
			const onAllow = async (
				manual: boolean,
				allow: boolean,
				remember: boolean,
				options?: any
			) => {
				// confirm
				console.log(
					Date.now(),
					allow ? 'allowed' : 'disallowed',
					npub,
					method,
					options,
					params,
				)
				if (manual) {
					await dbi.confirmPending(id, allow)

					if (!(method === 'connect' && !allow)) {
						// only add app if it's not 'disallow connect'
						if (!(await dbi.getApp(req.appNpub))) {
							await dbi.addApp({
								appNpub: req.appNpub,
								npub: req.npub,
								timestamp: Date.now(),
								name: '',
								icon: '',
								url: '',
							})
						}
					}
				} else {
					// just send to db w/o waiting for it
					// if (!PERF_TEST)
					dbi.addConfirmed({
						...req,
						allowed: allow,
					})
				}

				// for notifications
				self.accessBuffer.push(req)

				// clear from pending
				const index = self.confirmBuffer.findIndex(
					(r) => r.req.id === id,
				)
				if (index >= 0) self.confirmBuffer.splice(index, 1)

				if (remember) {

					let perm = getReqPerm(req)
					if (allow && options && options.perm)
						perm = options.perm

					await dbi.addPerm({
						id: req.id,
						npub: req.npub,
						appNpub: req.appNpub,
						perm,
						value: allow ? '1' : '0',
						timestamp: Date.now(),
					})

					this.perms = await dbi.listPerms()

					const otherReqs = self.confirmBuffer.filter(
						(r) => r.req.appNpub === req.appNpub,
					)
					console.log("updated perms", this.perms, "otherReqs", otherReqs)
					for (const r of otherReqs) {
						const perm = this.getPerm(r.req);
//						if (r.req.method === req.method) {
						if (perm) {
							r.cb(perm === '1', false)
						}
					}
				}

				// notify UI that it was confirmed
				// if (!PERF_TEST)
				this.updateUI()

				// return to let nip46 flow proceed
				ok(allow)
			}

			// check perms
			const perm = this.getPerm(req)
			console.log(Date.now(), 'perm', req.id, perm)

			// have perm?
			if (perm) {
				// reply immediately
				onAllow(false, perm === '1', false)
			} else {
				// put pending req to db
				await dbi.addPending(req)

				// need manual confirmation
				console.log('need confirm', req)

				// put to a list of pending requests
				this.confirmBuffer.push({
					req,
					cb: (allow, remember, options) => onAllow(true, allow, remember, options),
				})

				// show notifs
				this.notify()

				// notify main thread to ask for user concent
				// FIXME show a 'confirm' notification?
				this.updateUI()
			}
		})
	}

	private async startKey({
		npub,
		sk,
		backoff = 1000,
	}: {
		npub: string
		sk: string
		backoff?: number
	}) {
		const ndk = new NDK({
			explicitRelayUrls: NIP46_RELAYS,
		})

		// init relay objects but dont wait until we connect
		ndk.connect()

		const signer = new NDKPrivateKeySigner(sk) // PrivateKeySigner
		const backend = new NDKNip46Backend(ndk, sk, () =>
			Promise.resolve(true),
		)
		this.keys.push({ npub, backend, signer, ndk, backoff })

		// new method
		backend.handlers['get_nip04_key'] = new Nip04KeyHandlingStrategy(sk)

		// assign our own permission callback
		for (const method in backend.handlers) {
			backend.handlers[method] = new EventHandlingStrategyWrapper(
				npub,
				method,
				backend.handlers[method],
				this.allowPermitCallback.bind(this),
			)
		}

		// start
		backend.start()
		console.log('started', npub)

		// backoff reset on successfull connection
		const self = this
		const onConnect = () => {
			// reset backoff
			const key = self.keys.find((k) => k.npub === npub)
			if (key) key.backoff = 0
			console.log('reset backoff for', npub)
		}

		// reconnect handling
		let reconnected = false
		const onDisconnect = () => {
			if (reconnected) return
			if (ndk.pool.connectedRelays().length > 0) return
			reconnected = true
			console.log(new Date(), 'all relays are down for key', npub)

			// run full restart after a pause
			const bo = self.keys.find((k) => k.npub === npub)?.backoff || 1000
			setTimeout(() => {
				console.log(
					new Date(),
					'reconnect relays for key',
					npub,
					'backoff',
					bo,
				)
				// @ts-ignore
				for (const r of ndk.pool.relays.values()) r.disconnect()
				// make sure it no longer activates
				backend.handlers = {}

				self.keys = self.keys.filter((k) => k.npub !== npub)
				self.startKey({ npub, sk, backoff: Math.min(bo * 2, 60000) })
			}, bo)
		}

		// @ts-ignore
		for (const r of ndk.pool.relays.values()) {
			r.on('connect', onConnect)
			r.on('disconnect', onDisconnect)
		}
	}

	public async unlock(npub: string) {
		console.log('unlocking', npub)
		if (!this.isLocked(npub))
			throw new Error(`Key ${npub} already unlocked`)
		const info = this.enckeys.find((k) => k.npub === npub)
		if (!info) throw new Error(`Key ${npub} not found`)
		const { type } = nip19.decode(npub)
		if (type !== 'npub') throw new Error(`Invalid npub ${npub}`)
		const sk = await this.keysModule.decryptKeyLocal({
			enckey: info.enckey,
			// @ts-ignore
			localKey: info.localKey,
		})
		await this.startKey({ npub, sk })
	}

	private async generateKey() {
		const k = await this.addKey()
		this.updateUI()
		return k
	}

	private async importKey(nsec: string) {
		const k = await this.addKey(nsec)
		this.updateUI()
		return k
	}

	private async saveKey(npub: string, passphrase: string) {
		const info = this.enckeys.find((k) => k.npub === npub)
		if (!info) throw new Error(`Key ${npub} not found`)
		const sk = await this.keysModule.decryptKeyLocal({
			enckey: info.enckey,
			// @ts-ignore
			localKey: info.localKey,
		})
		const { enckey, pwh } = await this.keysModule.encryptKeyPass({
			key: sk,
			passphrase,
		})
		await this.sendKeyToServer(npub, enckey, pwh)
	}

	private async fetchKey(npub: string, passphrase: string) {
		const { type, data: pubkey } = nip19.decode(npub)
		if (type !== 'npub') throw new Error(`Invalid npub ${npub}`)
		const { pwh } = await this.keysModule.generatePassKey(
			pubkey,
			passphrase,
		)
		const { data: enckey } = await this.fetchKeyFromServer(npub, pwh)

		// key already exists?
		const key = this.enckeys.find((k) => k.npub === npub)
		if (key) return this.keyInfo(key)

		// add new key
		const nsec = await this.keysModule.decryptKeyPass({
			pubkey,
			enckey,
			passphrase,
		})
		const k = await this.addKey(nsec)
		this.updateUI()
		return k
	}

	private async confirm(id: string, allow: boolean, remember: boolean, options?: any) {
		const req = this.confirmBuffer.find((r) => r.req.id === id)
		if (!req) {
			console.log('req ', id, 'not found')

			await dbi.removePending(id)
			this.updateUI()
		} else {
			console.log('confirming req', id, allow, remember, options)
			req.cb(allow, remember, options)
		}
	}

	private async deleteApp(appNpub: string) {
		this.perms = this.perms.filter((p) => p.appNpub !== appNpub)
		await dbi.removeApp(appNpub)
		await dbi.removeAppPerms(appNpub)
		this.updateUI()
	}

	private async deletePerm(id: string) {
		this.perms = this.perms.filter((p) => p.id !== id)
		await dbi.removePerm(id)
		this.updateUI()
	}

	private async enablePush(): Promise<boolean> {
		const options = {
			userVisibleOnly: true,
			applicationServerKey: WEB_PUSH_PUBKEY,
		}

		const pushSubscription =
			await this.swg.registration.pushManager.subscribe(options)
		console.log('push endpoint', JSON.stringify(pushSubscription))

		if (!pushSubscription) {
			console.log('failed to enable push subscription')
			return false
		}

		// subscribe to all pubkeys
		for (const k of this.keys) {
			await this.sendSubscriptionToServer(k.npub, pushSubscription)
		}
		console.log('push enabled')

		return true
	}

	public async onMessage(event: any) {
		const { id, method, args } = event.data
		try {
			//console.log("UI message", id, method, args)
			let result = undefined
			if (method === 'generateKey') {
				result = await this.generateKey()
			} else if (method === 'importKey') {
				result = await this.importKey(args[0])
			} else if (method === 'saveKey') {
				result = await this.saveKey(args[0], args[1])
			} else if (method === 'fetchKey') {
				result = await this.fetchKey(args[0], args[1])
			} else if (method === 'confirm') {
				result = await this.confirm(args[0], args[1], args[2], args[3])
			} else if (method === 'deleteApp') {
				result = await this.deleteApp(args[0])
			} else if (method === 'deletePerm') {
				result = await this.deletePerm(args[0])
			} else if (method === 'enablePush') {
				result = await this.enablePush()
			} else {
				console.log('unknown method from UI ', method)
			}
			event.source.postMessage({
				id,
				result,
			})
		} catch (e: any) {
			event.source.postMessage({
				id,
				error: e.toString(),
			})
		}
	}

	private async updateUI() {
		const clients = await this.swg.clients.matchAll()
		console.log('updateUI clients', clients.length)
		for (const client of clients) {
			client.postMessage({})
		}
	}

	public async onPush(event: any) {
		console.log('push', { data: event.data })
		// noop - we just need browser to launch this worker
		// FIXME use event.waitUntil and and unblock after we
		// show a notification
	}
}
