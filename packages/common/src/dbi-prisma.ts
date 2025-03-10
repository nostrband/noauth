import { History, Pending, PrismaClient } from '@prisma/client'
import { DbApp, DbConnectToken, DbHistory, DbInterface, DbKey, DbPending, DbPerm } from './db-types'

const prisma = new PrismaClient()

const ALGO_LOCAL = 'AES-CBC'
const KEY_SIZE_LOCAL = 256

async function exportCryptoKey(key: CryptoKey): Promise<string> {
  const exported = await globalThis.crypto.subtle.exportKey('raw', key)
  const base64Key = Buffer.from(exported).toString('base64')
  return base64Key
}

async function importCryptoKey(base64Key: string): Promise<CryptoKey> {
  const keyBuffer = Buffer.from(base64Key, 'base64')
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: ALGO_LOCAL, length: KEY_SIZE_LOCAL },
    true,
    ['encrypt', 'decrypt']
  )
  return key
}

const dbiPrisma: DbInterface = {
  addKey: async (key: DbKey) => {
    try {
      const { npub, ...keyRest } = key
      const exportedKey = await exportCryptoKey(keyRest.localKey as CryptoKey)
      await prisma.keys.create({
        data: {
          npub: npub,
          jsonData: JSON.stringify({ ...keyRest, localKey: exportedKey }),
        },
      })
    } catch (error: any) {
      console.error(`Error adding key: ${error.message}`)
      throw error
    }
  },
  deleteKey: async (npub: string) => {
    throw new Error('Not implemented')
  },
  getKey: async (npub: string) => {
    try {
      const key = await prisma.keys.findUnique({ where: { npub } })
      if (!key) return undefined

      const parseJsonData = JSON.parse(key.jsonData)
      const localKey = await importCryptoKey(parseJsonData.localKey)

      const parseKey: DbKey = {
        npub: key.npub,
        ...parseJsonData,
        localKey,
      }
      return parseKey
    } catch (error: any) {
      console.error(`Error retrieving key: ${error.message}`)
      throw error
    }
  },
  listKeys: async () => {
    try {
      const keys = await prisma.keys.findMany()
      const parseKeys: DbKey[] = []

      for (const key of keys) {
        const parseJsonData = JSON.parse(key.jsonData)
        const localKey = await importCryptoKey(parseJsonData.localKey)
        parseKeys.push({ npub: key.npub, ...parseJsonData, localKey })
      }

      return parseKeys
    } catch (error: any) {
      console.error(`Error listing keys: ${error.message}`)
      throw error
    }
  },
  editName: async (npub: string, name: string) => {
    try {
      const key = await prisma.keys.findUnique({
        where: {
          npub,
        },
      })

      if (!key) throw new Error('Key not found!')

      const parseJsonData = JSON.parse(key.jsonData)
      const editName = { ...parseJsonData, name }
      await prisma.keys.update({ where: { npub }, data: { jsonData: JSON.stringify(editName) } })
    } catch (error: any) {
      console.error(`Error editing name: ${error.message}`)
      throw error
    }
  },
  editNcryptsec: async (npub: string, ncryptsec: string) => {
    try {
      const key = await prisma.keys.findUnique({
        where: {
          npub,
        },
      })
      if (!key) throw new Error('Key not found!')

      const parseJsonData = JSON.parse(key.jsonData)
      const editNcryptsec = { ...parseJsonData, ncryptsec }
      await prisma.keys.update({ where: { npub }, data: { jsonData: JSON.stringify(editNcryptsec) } })
    } catch (error: any) {
      console.log(`Error editing ncryptsec: ${error.message}`)
      throw error
    }
  },
  // getApp: async (appNpub: string) => {
  //   try {
  //     const app = await prisma.apps.findUnique({ where: { appNpub } })
  //     if (!app) throw new Error('App not found!')

  //     const parseJsonData = JSON.parse(app.jsonData)
  //     return {
  //       appNpub: app.appNpub,
  //       npub: app.appNpub,
  //       name: app.name,
  //       timestamp: Number(app.timestamp),
  //       ...parseJsonData,
  //     }
  //   } catch (error: any) {
  //     console.error(`Error retrieving app: ${error.message}`)
  //     throw error
  //   }
  // },

  addApp: async (app: DbApp) => {
    try {
      const { appNpub, name, npub, timestamp, ...appRest } = app
      await prisma.apps.create({
        data: {
          appNpub,
          name,
          npub,
          timestamp,
          jsonData: JSON.stringify(appRest),
        },
      })
    } catch (error: any) {
      console.error(`Error adding app: ${error.message}`)
      throw error
    }
  },
  updateApp: async (app: DbApp) => {
    try {
      const { appNpub, name, npub, timestamp, ...appRest } = app
      await prisma.apps.update({
        where: { appId: { appNpub, npub } },
        data: {
          appNpub,
          name,
          npub,
          timestamp,
          jsonData: JSON.stringify(appRest),
        },
      })
    } catch (error: any) {
      console.error(`Error updating app: ${error.message}`)
      throw error
    }
  },
  listApps: async () => {
    try {
      const apps = await prisma.apps.findMany()
      const parseApps: DbApp[] = []

      for (const app of apps) {
        const parseJsonData = JSON.parse(app.jsonData)
        parseApps.push({
          appNpub: app.appNpub,
          npub: app.npub,
          name: app.name,
          timestamp: Number(app.timestamp),
          ...parseJsonData,
        })
      }
      return parseApps
    } catch (error: any) {
      console.error(`Error listing apps: ${error.message}`)
      throw error
    }
  },
  removeApp: async (appNpub: string, npub: string) => {
    try {
      await prisma.apps.delete({ where: { appId: { appNpub, npub } } })
    } catch (error: any) {
      console.error(`Error removing app: ${error.message}`)
      throw error
    }
  },
  updateAppPermTimestamp: async (appNpub: string, npub: string, timestamp = 0) => {
    try {
      const app = await prisma.apps.findUnique({ where: { appId: { appNpub, npub } } })
      if (!app) throw new Error('App not found!')

      const permUpdateTimestamp = timestamp || Date.now()
      const parseJsonData = JSON.parse(app.jsonData)
      const updateAppPermTimestamp = { ...parseJsonData, permUpdateTimestamp }

      await prisma.apps.update({
        where: {
          appId: { appNpub, npub },
        },
        data: {
          ...app,
          jsonData: JSON.stringify(updateAppPermTimestamp),
        },
      })
      return permUpdateTimestamp
    } catch (error: any) {
      console.error(`Error editing app permission timestamp: ${error.message}`)
      return 0
    }
  },
  getAppLastActiveRecord: async (app: DbApp) => {
    try {
      const records = await prisma.history.findMany({
        where: {
          npub: app.npub,
          appNpub: app.appNpub,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 1,
      })
      const lastActive = records[0]
      return lastActive ? Number(lastActive.timestamp) : 0
    } catch (error: any) {
      console.error(`Error retrieving app last active record: ${error.message}`)
      return 0
    }
  },
  addPerm: async (perm: DbPerm) => {
    try {
      await prisma.perms.create({
        data: {
          ...perm,
        },
      })
    } catch (error: any) {
      console.error(`Error adding permission: ${error.message}`)
      throw error
    }
  },
  listPerms: async () => {
    try {
      const perms = await prisma.perms.findMany()
      const parsePerms: DbPerm[] = perms.map((p) => ({
        ...p,
        timestamp: Number(p.timestamp),
      }))
      return parsePerms
    } catch (error: any) {
      console.error(`Error listing permissions: ${error.message}`)
      throw error
    }
  },
  removePerm: async (id: string) => {
    try {
      await prisma.perms.delete({ where: { id } })
    } catch (error: any) {
      console.error(`Error removing permission: ${error.message}`)
      throw error
    }
  },
  removeAppPerms: async (appNpub: string, npub: string) => {
    try {
      await prisma.perms.deleteMany({ where: { appNpub, npub } })
    } catch (error) {
      console.log(`Error removing app permissions: ${error}`)
    }
  },
  addPending: async (r: DbPending) => {
    try {
      const exists: Pending | null = await prisma.pending.findUnique({
        where: { id: r.id },
      })

      const existsInHistory: History | null = await prisma.history.findUnique({
        where: { id: r.id },
      })

      if (exists || existsInHistory) return false

      const { id, appNpub, npub, method, timestamp, ...rest } = r

      await prisma.pending.create({
        data: {
          id,
          appNpub,
          npub,
          method,
          timestamp,
          jsonData: JSON.stringify(rest),
        },
      })

      return true
    } catch (error) {
      console.log(`Error adding pending request: ${error}`)
      return false
    }
  },
  removePending: async (id: string) => {
    try {
      await prisma.pending.delete({ where: { id } })
    } catch (error: any) {
      // not found? that's fine
      if (error.code !== 'P2025') console.log(`Error removing pending request: ${error}`)
    }
  },
  listPending: async () => {
    try {
      const pending = await prisma.pending.findMany()
      const parsePending: DbPending[] = pending.map((p) => {
        return {
          id: p.id,
          npub: p.npub,
          appNpub: p.appNpub,
          method: p.method,
          timestamp: Number(p.timestamp),
          ...JSON.parse(p.jsonData),
        }
      })
      return parsePending
    } catch (error) {
      console.log(`Error listing pending requests: ${error}`)
      return []
    }
  },
  confirmPending: async (id: string, allowed: boolean) => {
    try {
      const pending = await prisma.pending.findUnique({
        where: { id: id },
      })

      if (!pending) throw new Error('Pending not found ' + id)

      const h: DbHistory = {
        appNpub: pending.appNpub,
        id: pending.id,
        method: pending.method,
        npub: pending.npub,
        timestamp: Number(pending.timestamp),
        allowed,
        ...JSON.parse(pending.jsonData),
      }

      await prisma.pending.delete({
        where: { id: id },
      })

      const { id: hId, appNpub, method, npub, timestamp, allowed: hAllowed, result = '', ...rest } = h
      await prisma.history.create({
        data: {
          id: hId,
          appNpub,
          method,
          npub,
          timestamp,
          allowed: hAllowed,
          jsonData: JSON.stringify(rest),
          result: result || '',
        },
      })
    } catch (error) {
      console.log(`Error confirm pending request: ${error}`)
    }
  },
  addConfirmed: async (r: DbHistory) => {
    try {
      const { id, appNpub, method, npub, timestamp, allowed, result = '', ...rest } = r
      await prisma.history.create({
        data: {
          id,
          appNpub,
          method,
          npub,
          timestamp,
          allowed,
          jsonData: JSON.stringify(rest),
          result: result || '',
        },
      })
    } catch (error) {
      console.log(`Error adding confirm: ${error}`)
      return false
    }
  },
  addResult: async (id: string, result: string | undefined) => {
    try {
      if (!result) return

      await prisma.history.update({
        where: { id: id },
        data: { result: result },
      })
    } catch (error) {
      console.log(`Error adding result: ${error}`)
    }
  },
  getSynced: async (npub: string) => {
    try {
      const result = await prisma.syncHistory.count({ where: { npub } })
      return result > 0
    } catch (error) {
      console.log(`Error getting sync: ${error}`)
      return false
    }
  },
  setSynced: async (npub: string) => {
    try {
      await prisma.syncHistory.upsert({
        create: {
          npub,
        },
        where: {
          npub,
        },
        update: {
          npub,
        },
      })
    } catch (error) {
      console.log(`Error setting sync: ${error}`)
      throw error
    }
  },
  addConnectToken: async (r: DbConnectToken) => {
    try {
      const { npub, subNpub, expiry, timestamp, token, ...rest } = r
      await prisma.connectTokens.create({
        data: {
          npub,
          subNpub,
          expiry,
          timestamp,
          token,
          jsonData: JSON.stringify(rest),
        },
      })
    } catch (error) {
      console.log(`Error adding connect token: ${error}`)
      return false
    }
  },
  getConnectToken: async (npub: string, subNpub?: string) => {
    try {
      const whereClause = {
        npub: npub,
        ...(subNpub && { subNpub: subNpub }),
      }

      const token = await prisma.connectTokens.findFirst({
        where: whereClause,
      })

      if (!token || Number(token.expiry) > Date.now()) return undefined

      return {
        expiry: Number(token.expiry),
        timestamp: Number(token.timestamp),
        npub: token.npub,
        token: token.token,
        subNpub: token.subNpub || undefined,
      }
    } catch (error) {
      console.error(`Error retrieving connect token: ${error}`)
      return undefined
    }
  },
  listConnectTokens: async () => {
    try {
      const tokens = await prisma.connectTokens.findMany()
      const parseTokens: DbConnectToken[] = tokens.map((ct) => {
        return {
          npub: ct.npub,
          expiry: Number(ct.expiry),
          timestamp: Number(ct.timestamp),
          token: ct.token,
          subNpub: ct.subNpub || undefined,
        }
      })
      return parseTokens
    } catch (error) {
      console.log(`Error listing connect tokens: ${error}`)
      return []
    }
  },
  removeConnectToken: async (token: string) => {
    try {
      await prisma.connectTokens.delete({ where: { token } })
    } catch (error) {
      console.log(`Error removing connect token: ${error}`)
    }
  },
  listHistory: async (appNpub: string) => {
    try {
      const history = await prisma.history.findMany({
        where: {
          appNpub,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 30,
      })
      const parseHistory: DbHistory[] = history.map((h) => {
        return {
          id: h.id,
          appNpub: h.appNpub,
          allowed: h.allowed,
          method: h.method,
          npub: h.npub,
          timestamp: Number(h.timestamp),
          ...JSON.parse(h.jsonData),
          result: h?.result || '',
        }
      })

      return parseHistory
    } catch (error) {
      console.error(`Error listing history: ${error}`)
      return []
    }
  },
}

export default dbiPrisma
