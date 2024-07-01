import { DbPerm } from '@noauth/common'

export type Perm = DbPerm & { checked: boolean }
