import { DbInterface } from './src/db-types'

export let dbi: DbInterface

if (process.env.COMMON_HOSTED === 'true') {
  import('./src/dbi-prisma').then((prismaModule) => {
    console.log(prismaModule.default, 'prismaModule')
    dbi = prismaModule.default
  })
} else {
  import('./src/dbi-dexie').then((dexieModule) => {
    console.log(dexieModule.default, 'dexieModule')
    dbi = dexieModule.default
  })
}

export * from './src/db-types'
export * from './src/consts'
export * from './src/helpers'
export * from './src/keys'
export * from './src/nostr'
export * from './src/meta'
export * from './src/meta-event'
