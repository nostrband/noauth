import { db } from '@/modules/db'

export const checkNpubSyncQuerier = (npub: string) => async () => {
  const count = await db.syncHistory.where('npub').equals(npub).count()
  return count > 0
}
