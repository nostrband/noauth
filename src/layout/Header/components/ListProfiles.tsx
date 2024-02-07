import { DbKey } from '@/modules/db'
import { getShortenNpub } from '@/utils/helpers/helpers'
import { Avatar, ListItemIcon, MenuItem, Stack, Typography } from '@mui/material'
import React, { FC } from 'react'

type ListProfilesProps = {
  keys: DbKey[]
  onClickItem: (key: DbKey) => void
}

export const ListProfiles: FC<ListProfilesProps> = ({ keys = [], onClickItem }) => {
  return (
    <Stack maxHeight={'10rem'} overflow={'auto'}>
      {keys.map((key) => {
        const userName = key?.profile?.info?.name || getShortenNpub(key.npub)
        const userAvatar = key?.profile?.info?.picture || ''
        return (
          <MenuItem sx={{ gap: '0.5rem' }} onClick={() => onClickItem(key)} key={key.npub}>
            <ListItemIcon>
              <Avatar src={userAvatar} alt={userName} sx={{ width: 36, height: 36 }} />
            </ListItemIcon>
            <Typography variant="body2" noWrap>
              {userName}
            </Typography>
          </MenuItem>
        )
      })}
    </Stack>
  )
}
