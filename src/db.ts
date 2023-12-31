import Dexie from 'dexie'

export interface DbKey {
  npub: string
  nip05?: string
  name?: string
  avatar?: string
  relays?: string[]
  enckey: string
}

export interface DbApp {
  appNpub: string
  npub: string
  name: string
  icon: string
  url: string
  timestamp: number
}

export interface DbPerm {
  id: string
  npub: string
  appNpub: string
  perm: string
  value: string
  timestamp: number
}

export interface DbPending {
  id: string
  npub: string
  appNpub: string
  timestamp: number
  method: string
  params: string
}

export interface DbHistory {
  id: string
  npub: string
  appNpub: string
  timestamp: number
  method: string
  params: string
  allowed: boolean
}

export interface DbSchema extends Dexie {
  keys: Dexie.Table<DbKey, string>
  apps: Dexie.Table<DbApp, string>
  perms: Dexie.Table<DbPerm, string>
  pending: Dexie.Table<DbPending, string>
  history: Dexie.Table<DbHistory, string>
}

export const db = new Dexie('noauthdb') as DbSchema

db.version(7).stores({
  keys: 'npub',
  apps: 'appNpub,npub,name,timestamp',
  perms: 'id,npub,appNpub,perm,value,timestamp',
  pending: 'id,npub,appNpub,timestamp,method',
  history: 'id,npub,appNpub,timestamp,method,allowed',
  requestHistory: 'id'
})

export const dbi = {
  addKey: async (key: DbKey) => {
    try {
      await db.keys.add(key)
    } catch (error) {
      console.log(`db addKey error: ${error}`)
    }
  },
  listKeys: async (): Promise<DbKey[]> => {
    try {
      return await db.keys.toArray()
    } catch (error) {
      console.log(`db listKeys error: ${error}`)
      return []
    }
  },
  getApp: async (appNpub: string) => {
    try {
      return await db.apps.get(appNpub)
    } catch (error) {
      console.log(`db getApp error: ${error}`)
    }
  },
  addApp: async (app: DbApp) => {
    try {
      await db.apps.add(app)
    } catch (error) {
      console.log(`db addApp error: ${error}`)
    }
  },
  listApps: async (): Promise<DbApp[]> => {
    try {
      return await db.apps.toArray()
    } catch (error) {
      console.log(`db listApps error: ${error}`)
      return []
    }
  },
  removeApp: async (appNpub: string) => {
    try {
      return await db.apps.delete(appNpub)
    } catch (error) {
      console.log(`db removeApp error: ${error}`)
    }
  },
  addPerm: async (perm: DbPerm) => {
    try {
      await db.perms.add(perm)
    } catch (error) {
      console.log(`db addPerm error: ${error}`)
    }
  },
  listPerms: async (): Promise<DbPerm[]> => {
    try {
      return await db.perms.toArray()
    } catch (error) {
      console.log(`db listPerms error: ${error}`)
      return []
    }
  },
  removePerm: async (id: string) => {
    try {
      return await db.perms.delete(id)
    } catch (error) {
      console.log(`db removePerm error: ${error}`)
    }
  },
  removeAppPerms: async (appNpub: string) => {
    try {
      return await db.perms.where({ appNpub }).delete()
    } catch (error) {
      console.log(`db removeAppPerms error: ${error}`)
    }
  },
  addPending: async (r: DbPending) => {
    try {
      return db.transaction('rw', db.pending, db.history, async () => {
        const exists = (await db.pending.where('id').equals(r.id).toArray()).length > 0
          || (await db.history.where('id').equals(r.id).toArray()).length > 0
        if (exists) return false

        await db.pending.add(r)
        return true
      })
    } catch (error) {
      console.log(`db addPending error: ${error}`)
      return false
    }
  },
  removePending: async (id: string) => {
    try {
      return await db.pending.delete(id)
    } catch (error) {
      console.log(`db removePending error: ${error}`)
    }
  },
  listPending: async (): Promise<DbPending[]> => {
    try {
      return await db.pending.toArray()
    } catch (error) {
      console.log(`db listPending error: ${error}`)
      return []
    }
  },
  confirmPending: async (id: string, allowed: boolean) => {
    try {
      db.transaction('rw', db.pending, db.history, async () => {
        const r: DbPending | undefined
          = await db.pending.where('id').equals(id).first()
        if (!r) throw new Error("Pending not found " + id)
        const h: DbHistory = {
          ...r,
          allowed
        }
        await db.pending.delete(id)
        await db.history.add(h)
      })
    } catch (error) {
      console.log(`db addPending error: ${error}`)
    }
  },
  addConfirmed: async (r: DbHistory) => {
    try {
      await db.history.add(r)
    } catch (error) {
      console.log(`db addConfirmed error: ${error}`)
      return false
    }
  },
}
