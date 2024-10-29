import { AppNostrSize } from '@/types/app-nsec'
import { AvatarProps, BoxProps } from '@mui/material'

export type IconAppProps = {
  size?: AppNostrSize
  isSmall?: boolean
  onClick?: () => void
  isNotLoaded?: boolean
  isRounded?: boolean
}

export type IconAppBase = {
  picture: string
  alt?: string
  domain?: string
  getAppTitle?: (title: string) => string
}

export type IIconApp = Omit<IconAppProps, 'isNotLoaded'> & IconAppBase

export type IBoxStyled = IconAppProps & BoxProps

export type IAvatarStyled = {
  size?: AppNostrSize
  isSmall?: boolean
} & AvatarProps
