import { db } from '@/modules/db'

export const checkNpubSyncQuerier = (npub: string, onResolve: () => void) => async () => {
  const count = await db.syncHistory.where('npub').equals(npub).count()
  if (!count) onResolve()
  return count > 0
}
