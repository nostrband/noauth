import { AppNostrSize } from '@/types/app-nsec'
import { AvatarProps, BoxProps } from '@mui/material'

export type IconAppProps = {
  size?: AppNostrSize
  isRounded?: boolean
  isSmall?: boolean
  onClick?: () => void
  isNotLoaded?: boolean
}

export type IconAppBase = {
  picture: string
  alt?: string
}

export type IIconApp = Omit<IconAppProps, 'isNotLoaded'> & IconAppBase

export type IBoxStyled = IconAppProps & BoxProps

export type IAvatarStyled = {
  size?: AppNostrSize
  isSmall?: boolean
} & AvatarProps
