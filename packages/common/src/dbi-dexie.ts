import Dexie from 'dexie'
import { DbApp, DbConnectToken, DbHistory, DbInterface, DbKey, DbPending, DbPerm, DbSyncHistory } from './db-types'

interface DbSchema extends Dexie {
  keys: Dexie.Table<DbKey, string>
  apps: Dexie.Table<DbApp, string>
  perms: Dexie.Table<DbPerm, string>
  pending: Dexie.Table<DbPending, string>
  history: Dexie.Table<DbHistory, string>
  syncHistory: Dexie.Table<DbSyncHistory, string>
  connectTokens: Dexie.Table<DbConnectToken, string>
}

const db = new Dexie('noauthdb') as DbSchema

db.version(12).stores({
  keys: 'npub',
  apps: 'appNpub,npub,name,timestamp',
  perms: 'id,npub,appNpub,perm,value,timestamp',
  pending: 'id,npub,appNpub,timestamp,method',
  history: 'id,npub,appNpub,timestamp,method,allowed,[npub+appNpub]',
  syncHistory: 'npub',
  connectTokens: 'token,npub,timestamp,expiry,subNpub,[npub+subNpub]',
})

const dbiDexie: DbInterface = {
  addKey: async (key: DbKey) => {
    try {
      await db.keys.add(key)
    } catch (error) {
      console.log(`db addKey error: ${error}`)
    }
  },
  deleteKey: async (npub: string) => {
    try {
      await db.keys.delete(npub);
      await db.apps.where({ npub }).delete();
      await db.perms.where({ npub }).delete();
      await db.pending.where({ npub }).delete();
      await db.history.where({ npub }).delete();
      await db.syncHistory.where({ npub }).delete();
      await db.connectTokens.where({ npub }).delete();
    } catch (error) {
      console.log(`db addKey error: ${error}`)
    }
  },
  getKey: async (npub: string) => {
    try {
      return await db.keys.get(npub)
    } catch (error) {
      console.log(`db getKey error: ${error}`)
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
  editName: async (npub: string, name: string): Promise<void> => {
    try {
      await db.keys.where({ npub }).modify({
        name,
      })
    } catch (error) {
      console.log(`db editName error: ${error}`)
      return
    }
  },
  editNcryptsec: async (npub: string, ncryptsec: string): Promise<void> => {
    try {
      await db.keys.where({ npub }).modify({
        ncryptsec,
      })
    } catch (error) {
      console.log(`db editName error: ${error}`)
      return
    }
  },
  // getApp: async (appNpub: string) => {
  //   try {
  //     return await db.apps.get(appNpub)
  //   } catch (error) {
  //     console.log(`db getApp error: ${error}`)
  //   }
  // },
  addApp: async (app: DbApp) => {
    try {
      await db.apps.add(app)
    } catch (error) {
      console.log(`db addApp error: ${error}`)
    }
  },
  updateApp: async (app: DbApp) => {
    try {
      await db.apps.where({ appNpub: app.appNpub, npub: app.npub }).modify({
        name: app.name,
        icon: app.icon,
        url: app.url,
        updateTimestamp: app.updateTimestamp,
        subNpub: app.subNpub,
      })
    } catch (error) {
      console.log(`db updateApp error: ${error}`)
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
  removeApp: async (appNpub: string, npub: string) => {
    try {
      // FIXME npub is necessary when we change the
      // primary key from appNpub to appNpub+npub
      return await db.apps.delete(appNpub)
    } catch (error) {
      console.log(`db removeApp error: ${error}`)
    }
  },
  updateAppPermTimestamp: async (appNpub: string, npub: string, timestamp = 0) => {
    try {
      const permUpdateTimestamp = timestamp || Date.now()
      await db.apps.where({ appNpub, npub }).modify({
        permUpdateTimestamp,
      })
      return permUpdateTimestamp
    } catch (error) {
      console.log(`db updatePermTimestamp error: ${error}`)
    }
    return 0
  },
  getAppLastActiveRecord: async (app: DbApp) => {
    try {
      const records = await db.history.where({ npub: app.npub, appNpub: app.appNpub }).reverse().sortBy('timestamp')
      const lastActive = records.shift()
      return lastActive?.timestamp || 0
    } catch (error) {
      console.log(`db getAppLastActiveRecord error: ${error}`)
      return 0
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
  removeAppPerms: async (appNpub: string, npub: string) => {
    try {
      await db.perms.where({ appNpub, npub }).delete()
    } catch (error) {
      console.log(`db removeAppPerms error: ${error}`)
    }
  },
  addPending: async (r: DbPending) => {
    try {
      return db.transaction('rw', db.pending, db.history, async () => {
        const exists =
          (await db.pending.where('id').equals(r.id).toArray()).length > 0 ||
          (await db.history.where('id').equals(r.id).toArray()).length > 0
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
        const r: DbPending | undefined = await db.pending.where('id').equals(id).first()
        if (!r) throw new Error('Pending not found ' + id)
        const h: DbHistory = {
          ...r,
          allowed,
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
  getSynced: async (npub: string) => {
    try {
      const result = await db.syncHistory.where('npub').equals(npub).count()
      return result > 0
    } catch (error) {
      console.log(`db getSynced error: ${error}`)
      return false
    }
  },
  setSynced: async (npub: string) => {
    try {
      await db.syncHistory.put({ npub })
    } catch (error) {
      console.log(`db setSynced error: ${error}`)
    }
  },
  addConnectToken: async (r: DbConnectToken) => {
    try {
      await db.connectTokens.add(r)
    } catch (error) {
      console.log(`db addConnectToken error: ${error}`)
      return false
    }
  },
  getConnectToken: async (npub: string, subNpub?: string) => {
    try {
      let req: { npub: string; subNpub?: string } = { npub }
      if (subNpub) req = { ...req, subNpub }
      const token = await db.connectTokens.get(req)
      if (token && token.expiry > Date.now()) return token
      return undefined
    } catch (error) {
      console.log(`db getConnectToken error: ${error}`)
    }
  },
  listConnectTokens: async (): Promise<DbConnectToken[]> => {
    try {
      return await db.connectTokens.toArray()
    } catch (error) {
      console.log(`db connectTokens error: ${error}`)
      return []
    }
  },
  removeConnectToken: async (token: string) => {
    try {
      return await db.connectTokens.delete(token)
    } catch (error) {
      console.log(`db connectTokens error: ${error}`)
    }
  },
  listHistory: async (appNpub: string) => {
    try {
      const history = await db.history.where('appNpub').equals(appNpub).reverse().sortBy('timestamp')
      return history.slice(0, 30)
    } catch (error) {
      console.log(`db listHistory error: ${error}`)
      return []
    }
  },
}

export default dbiDexie
