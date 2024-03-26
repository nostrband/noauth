import { DbApp } from '@/modules/db'

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
