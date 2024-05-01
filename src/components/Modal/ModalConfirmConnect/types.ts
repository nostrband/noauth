import { DbPerm } from '@/modules/common/db-types'

export type Perm = DbPerm & { checked: boolean }
