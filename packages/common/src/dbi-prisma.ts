// @ts-nocheck
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
  getKey: async (npub: string) => {
    try {
      const result = await prisma.keys.findUnique({ where: { npub } })
      return result
    } catch (error: any) {
      console.error(`Error retrieving key: ${error.message}`)
      throw error
    }
  },
  listKeys: async () => {
    try {
      const keys = await prisma.keys.findMany()

      const parseKeys = []
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
      return await prisma.keys.update({ where: { npub }, data: { name } })
    } catch (error: any) {
      console.error(`Error editing name: ${error.message}`)
      throw error
    }
  },

  editNcryptsec: async (npub: string, ncryptsec: string): Promise<void> => {
    try {
      await prisma.keys.update({
        where: { npub },
        data: { ncryptsec },
      })
    } catch (error: any) {
      console.log(`db editNcryptsec error: ${error.message}`)
      throw error
    }
  },
  getApp: async (appNpub: string) => {
    try {
      return await prisma.apps.findUnique({ where: { appNpub } })
    } catch (error: any) {
      console.error(`Error retrieving app: ${error.message}`)
      throw error
    }
  },

  addApp: async (app: DbApp) => {
    try {
      return await prisma.apps.create({ data: app })
    } catch (error: any) {
      console.error(`Error adding app: ${error.message}`)
      throw error
    }
  },
  updateApp: async (app: DbApp) => {
    try {
      return await prisma.apps.update({
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
      return await prisma.apps.findMany()
    } catch (error: any) {
      console.error(`Error listing apps: ${error.message}`)
      throw error
    }
  },
  removeApp: async (appNpub: string) => {
    try {
      return await prisma.apps.delete({ where: { appNpub } })
    } catch (error: any) {
      console.error(`Error removing app: ${error.message}`)
      throw error
    }
  },
  updateAppPermTimestamp: async (appNpub: string, npub: string, timestamp = 0): Promise<number> => {
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
      console.error(`db updatePermTimestamp error: ${error.message}`)
      return 0
    }
  },
  getAppLastActiveRecord: async (app: DbApp): Promise<number> => {
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
      return lastActive ? lastActive.timestamp : 0
    } catch (error: any) {
      console.error(`db getAppLastActiveRecord error: ${error.message}`)
      return 0
    }
  },
  addPerm: async (perm: DbPerm) => {
    try {
      return await prisma.perms.create({ data: perm })
    } catch (error: any) {
      console.error(`Error adding permission: ${error.message}`)
      throw error
    }
  },
  listPerms: async () => {
    try {
      return await prisma.perms.findMany()
    } catch (error: any) {
      console.error(`Error listing permissions: ${error.message}`)
      throw error
    }
  },
  removePerm: async (id: string) => {
    try {
      return await prisma.perms.delete({ where: { id } })
    } catch (error: any) {
      console.error(`Error removing permission: ${error.message}`)
      throw error
    }
  },
  removeAppPerms: async (appNpub: string, npub: string) => {
    try {
      return await prisma.perms.deleteMany({ where: { appNpub } })
    } catch (error) {
      console.log(`db removeAppPerms error: ${error}`)
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
      console.log(`db addPending error: ${error}`)
      return false
    }
  },
  removePending: async (id: string) => {
    try {
      return await prisma.pending.delete({ where: { id } })
    } catch (error) {
      console.log(`db removePending error: ${error}`)
    }
  },
  listPending: async (): Promise<DbPending[]> => {
    try {
      return (await prisma.pending.findMany()) as unknown as DbPending[]
    } catch (error) {
      console.log(`db listPending error: ${error}`)
      return []
    }
  },
  confirmPending: async (id: string, allowed: boolean) => {
    try {
      const r: DbPending | null = await prisma.pending.findUnique({
        where: { id: id },
      })

      if (!r) throw new Error('Pending not found ' + id)

      const h: DbHistory = {
        ...r,
        allowed,
      }

      await prisma.pending.delete({
        where: { id: id },
      })

      await prisma.history.create({
        data: h,
      })
    } catch (error) {
      console.log(`db confirmPending error: ${error}`)
    }
  },
  addConfirmed: async (r: DbHistory) => {
    try {
      await prisma.history.create({ data: r })
    } catch (error) {
      console.log(`db addConfirmed error: ${error}`)
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
      console.log(`Prisma setSynced error: ${error}`)
      return false
    }
  },
  addConnectToken: async (r: DbConnectToken) => {
    try {
      await prisma.connectTokens.create({
        data: r,
      })
    } catch (error) {
      console.log(`Prisma addConnectToken error: ${error}`)
      return false
    }
  },
  getConnectToken: async (npub: string, subNpub?: string) => {
    try {
      let req: { npub: string; subNpub?: string } = { npub }
      if (subNpub) req = { ...req, subNpub }
      const token = await prisma.connectTokens.findUnique({
        where: req,
      })
      if (token && token.expiry > Date.now())
        return {
          ...token,
          expiry: Number(token.expiry),
          timestamp: Number(token.timestamp),
        }
      return undefined
    } catch (error) {
      console.log(`Prisma getConnectToken error: ${error}`)
    }
  },
  listConnectTokens: async (): Promise<DbConnectToken[]> => {
    try {
      return await prisma.connectTokens.findMany()
    } catch (error) {
      console.log(`db connectTokens error: ${error}`)
      return []
    }
  },
  removeConnectToken: async (token: string) => {
    try {
      return await prisma.connectTokens.delete({ where: { token } })
    } catch (error) {
      console.log(`db connectTokens error: ${error}`)
    }
  },
}

export default dbiPrisma
