import React, { FC } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { IconApp } from '@/shared/IconApp/IconApp'
import { Stack, Typography } from '@mui/material'

type SubNpubSelectValueProps = {
  subNpub: string
}

export const SubNpubSelectValue: FC<SubNpubSelectValueProps> = ({ subNpub }) => {
  const { userAvatar, userName } = useProfile(subNpub)
  return (
    <Stack direction={'row'} gap={'0.5rem'} alignItems={'center'}>
      <IconApp size="extra-small" picture={userAvatar} alt={userName} isRounded />
      <Typography variant="body2">{userName}</Typography>
    </Stack>
  )
}
