import { FC } from 'react'
import { MenuItem, Typography } from '@mui/material'
import { useProfile } from '@/hooks/useProfile'
import { IconApp } from '@/shared/IconApp/IconApp'
import { getShortenNpub } from '@noauth/common'
import { SubNpubOptionType } from '../utils/types'

type SubNpubMenuItemProps = {
  option: SubNpubOptionType
}

export const SubNpubMenuItem: FC<SubNpubMenuItemProps> = ({ option, ...restProps }) => {
  const { userAvatar, userName } = useProfile(option.subNpub || '')
  const subNpubName = userName || getShortenNpub(option.subNpub)

  return (
    <MenuItem {...restProps} sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <IconApp picture={userAvatar} alt={subNpubName} size="extra-small" isRounded />
      <Typography>{subNpubName}</Typography>
    </MenuItem>
  )
}
