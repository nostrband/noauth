import { DbPerm } from '@/modules/db'

export type Perm = DbPerm & { checked: boolean }
