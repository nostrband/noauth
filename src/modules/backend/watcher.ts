import NDK, { NDKEvent, NDKSigner, NDKSubscription, NDKSubscriptionCacheUsage, NDKUser } from "@nostr-dev-kit/ndk"
import { KIND_RPC } from "../common/consts"

export class Watcher {
  private ndk: NDK
  private signer: NDKSigner
  private onReply: (id: string) => void
  private sub?: NDKSubscription

  constructor(ndk: NDK, signer: NDKSigner, onReply: (id: string) => void) {
    this.ndk = ndk
    this.signer = signer
    this.onReply = onReply
  }

  async start() {
    this.sub = this.ndk.subscribe(
      {
        kinds: [KIND_RPC],
        authors: [(await this.signer.user()).pubkey],
        since: Math.floor(Date.now() / 1000 - 10),
      },
      {
        closeOnEose: false,
        cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY,
      }
    )
    this.sub.on('event', async (e: NDKEvent) => {
      const peer = e.tags.find((t) => t.length >= 2 && t[0] === 'p')
      console.log('watcher got event', { e, peer })
      if (!peer) return
      const decryptedContent = await this.signer.decrypt(new NDKUser({ pubkey: peer[1] }), e.content)
      const parsedContent = JSON.parse(decryptedContent)
      const { id, method, params, result, error } = parsedContent
      console.log('watcher got', { peer, id, method, params, result, error })
      if (method || result === 'auth_url') return
      this.onReply(id)
    })
  }

  stop() {
    this.sub!.stop()
  }
}

