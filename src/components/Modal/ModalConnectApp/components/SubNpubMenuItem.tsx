import { FC } from 'react'
import { MenuItem, Typography } from '@mui/material'
import { SubNpubOptionType } from '../ModalConnectApp'
import { useProfile } from '@/hooks/useProfile'
import { getShortenNpub } from '@/utils/helpers/helpers'
import { IconApp } from '@/shared/IconApp/IconApp'

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
