import { DbApp } from '@/modules/common/db-types'

export type IClientApp = DbApp & {
  lastActive: number
}

export type IAppGroup = IClientApp & {
  apps: IClientApp[]
  size: number
}

export type IKind = {
  kind: number
  name: string
}

export type SubNpubProfile = {
  picture: string
  subNpub: string
}

export type SubNpubsMap = Record<string, SubNpubProfile>
