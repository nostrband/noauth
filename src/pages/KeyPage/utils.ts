import { db } from '@/modules/common/db'

export const checkNpubSyncQuerier = (npub: string, onResolve: () => void) => async () => {
  const count = await db.syncHistory.where('npub').equals(npub).count()
  if (!count) onResolve()
  return count > 0
}
