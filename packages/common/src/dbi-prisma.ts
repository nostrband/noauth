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

interface KeyConfig {
  keyAlgorithm: AesKeyGenParams
  keyUsages: KeyUsage[]
}

async function importCryptoKey(base64Key: string, keyConfig: KeyConfig): Promise<CryptoKey> {
  const keyBuffer = Buffer.from(base64Key, 'base64')
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    keyConfig.keyAlgorithm,
    true,
    keyConfig.keyUsages
  )
  return key
}

const dbiPrisma: DbInterface = {
  addKey: async (key: DbKey) => {
    try {
      const exportedKey = await exportCryptoKey(key.localKey as CryptoKey)
      await prisma.keys.create({
        data: {
          npub: key.npub,
          ncryptsec: key.ncryptsec || '',
          jsonData: JSON.stringify({ ...key, localKey: exportedKey }),
        },
      })
    } catch (error: any) {
      console.error(`Error adding key: ${error.message}`)
      throw error
    }
  },
  getKey: async (npub: string): Promise<DbKey> => {
    try {
      const result = await prisma.keys.findUnique({ where: { npub } })
      return result as unknown as DbKey
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
        const parseJson = JSON.parse(key.jsonData || '{}')
        const localKey = await importCryptoKey(parseJson.localKey, {
          keyAlgorithm: { name: ALGO_LOCAL, length: KEY_SIZE_LOCAL },
          keyUsages: ['encrypt', 'decrypt'],
        })
        parseKeys.push({ ...key, ...parseJson, localKey })
      }

      return parseKeys
    } catch (error: any) {
      console.error(`Error listing keys: ${error.message}`)
      throw error
    }
  },
  editName: async (npub: string, name: string) => {
    try {
      await prisma.keys.update({ where: { npub }, data: { name } })
    } catch (error: any) {
      console.error(`Error editing name: ${error.message}`)
      throw error
    }
  },
  editNcryptsec: async (npub: string, ncryptsec: string) => {
    try {
      await prisma.keys.update({
        where: { npub },
        data: { ncryptsec },
      })
    } catch (error: any) {
      console.log(`Error editing ncryptsec: ${error.message}`)
      throw error
    }
  },
  getApp: async (appNpub: string) => {
    try {
      const result = await prisma.apps.findUnique({ where: { appNpub } })
      return result as unknown as DbApp
    } catch (error: any) {
      console.error(`Error retrieving app: ${error.message}`)
      throw error
    }
  },

  addApp: async (app: DbApp) => {
    try {
      await prisma.apps.create({ data: app })
    } catch (error: any) {
      console.error(`Error adding app: ${error.message}`)
      throw error
    }
  },
  updateApp: async (app: DbApp) => {
    try {
      await prisma.apps.update({
        where: { appNpub: app.appNpub },
        data: app,
      })
    } catch (error: any) {
      console.error(`Error updating app: ${error.message}`)
      throw error
    }
  },
  listApps: async () => {
    try {
      return (await prisma.apps.findMany()) as unknown as DbApp[]
    } catch (error: any) {
      console.error(`Error listing apps: ${error.message}`)
      throw error
    }
  },
  removeApp: async (appNpub: string) => {
    try {
      await prisma.apps.delete({ where: { appNpub } })
    } catch (error: any) {
      console.error(`Error removing app: ${error.message}`)
      throw error
    }
  },
  updateAppPermTimestamp: async (appNpub: string, npub: string, timestamp = 0) => {
    try {
      const permUpdateTimestamp = timestamp || Date.now()
      await prisma.apps.update({
        where: {
          appNpub,
        },
        data: {
          permUpdateTimestamp,
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
      await prisma.perms.create({ data: perm })
    } catch (error: any) {
      console.error(`Error adding permission: ${error.message}`)
      throw error
    }
  },
  listPerms: async () => {
    try {
      const perms = await prisma.perms.findMany()
      const parsePerms: DbPerm[] = perms.map((p) => {
        return {
          appNpub: p.appNpub,
          id: p.id,
          npub: p.npub,
          perm: p.perm,
          timestamp: Number(p.timestamp),
          value: p.value,
        }
      })
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

      await prisma.pending.create({
        data: r,
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
    } catch (error) {
      console.log(`Error removing pending request: ${error}`)
    }
  },
  listPending: async () => {
    try {
      const pending = await prisma.pending.findMany()
      const parsePending: DbPending[] = pending.map((p) => {
        return {
          appNpub: p.appNpub,
          id: p.id,
          method: p.method,
          npub: p.npub,
          timestamp: Number(p.timestamp),
          ...JSON.parse(p.jsonData || '{}'),
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
      const result = await prisma.pending.findUnique({
        where: { id: id },
      })

      if (!result) throw new Error('Pending not found ' + id)

      // @ts-ignore
      const h: DbHistory = {
        ...result,
        allowed,
      }

      await prisma.pending.delete({
        where: { id: id },
      })

      await prisma.history.create({
        data: h,
      })
    } catch (error) {
      console.log(`Error confirm pending request: ${error}`)
    }
  },
  addConfirmed: async (r: DbHistory) => {
    try {
      await prisma.history.create({ data: r })
    } catch (error) {
      console.log(`Error adding confirm: ${error}`)
      return false
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
      await prisma.syncHistory.create({
        data: {
          npub: npub,
        },
      })
    } catch (error) {
      console.log(`Error setting sync: ${error}`)
      throw error
    }
  },
  addConnectToken: async (r: DbConnectToken) => {
    try {
      await prisma.connectTokens.create({
        data: r,
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

      if (token && Number(token.expiry) > Date.now()) {
        return {
          expiry: Number(token.expiry),
          timestamp: Number(token.timestamp),
          npub: token.npub,
          token: token.token,
          subNpub: token.subNpub || undefined,
        }
      }

      return undefined
    } catch (error) {
      console.error(`Error retrieving connect token: ${error}`)
      return undefined
    }
  },
  listConnectTokens: async () => {
    try {
      const result = await prisma.connectTokens.findMany()
      const parseTokens: DbConnectToken[] = result.map((ct) => {
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
          ...JSON.parse(h.jsonData || '{}'),
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
