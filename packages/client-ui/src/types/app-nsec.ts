import { APP_NSEC_SIZE } from '@/utils/consts'
import { OverridableStringUnion } from './utils'

export type AppNostrSizeUnion = (typeof APP_NSEC_SIZE)[keyof typeof APP_NSEC_SIZE]

export type AppNostrSize = OverridableStringUnion<AppNostrSizeUnion>
