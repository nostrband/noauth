import { useProfile } from '@/hooks/useProfile'
import { DbKey } from '@/modules/db'
import { Avatar, ListItemIcon, MenuItem, Typography } from '@mui/material'
import React, { FC } from 'react'

type ListItemProfileProps = {
  onClickItem: () => void
} & DbKey

export const ListItemProfile: FC<ListItemProfileProps> = ({ onClickItem, npub }) => {
  const { userName, userAvatar, avatarTitle } = useProfile(npub)
  return (
    <MenuItem sx={{ gap: '0.5rem' }} onClick={onClickItem}>
      <ListItemIcon>
        <Avatar src={userAvatar} alt={userName} sx={{ width: 36, height: 36 }}>
          {avatarTitle}
        </Avatar>
      </ListItemIcon>
      <Typography variant="body2" noWrap>
        {userName}
      </Typography>
    </MenuItem>
  )
}
