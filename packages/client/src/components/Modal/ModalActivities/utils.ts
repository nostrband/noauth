import { DbHistory } from '@noauth/common'

export const getActivityHistoryQuerier = (appNpub: string) => () => {
  // if (!appNpub.trim().length) return []

  // const result = db.history
  //   .where('appNpub')
  //   .equals(appNpub)
  //   .reverse()
  //   .sortBy('timestamp')
  //   .then((a) => a.slice(0, 30))
  // .limit(30)
  // .toArray()

  return []
}

export const HistoryDefaultValue: DbHistory[] = []
