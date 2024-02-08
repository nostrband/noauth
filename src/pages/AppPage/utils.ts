import { DbHistory, db } from '@/modules/db'

export const getActivityHistoryQuerier = (appNpub: string) => () => {
  if (!appNpub.trim().length) return []

  const result = db.history
    .where('appNpub')
    .equals(appNpub)
    .reverse()
    .sortBy('timestamp')
    .then((a) => a.slice(0, 30))
  // .limit(30)
  // .toArray()

  return result
}

export const HistoryDefaultValue: DbHistory[] = []
