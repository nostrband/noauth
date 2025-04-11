import { FC, useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { Avatar, Skeleton, Stack, Typography } from '@mui/material'
import { nip19 } from 'nostr-tools'

type EnclaveProfileProps = {
  pubkey: string
}

export const EnclaveProfile: FC<EnclaveProfileProps> = (props) => {
  const npub = nip19.npubEncode(props.pubkey)
  const { avatarTitle, userAvatar, userName, isLoading } = useProfile(npub)
  const [isFailed, setIsFailed] = useState(false)

  const handleError = () => setIsFailed(true)

  if (isLoading) {
    return (
      <Stack direction={'row'} gap={'0.5rem'} alignItems={'center'} width={'100%'}>
        <Skeleton variant="circular" sx={{ minWidth: 40, minHeight: 40 }} />
        <Skeleton variant="text" sx={{ fontSize: '1rem', minWidth: '100px' }} />
      </Stack>
    )
  }

  return (
    <Stack direction={'row'} gap={'0.5rem'} alignItems={'center'}>
      <Avatar src={isFailed ? '/' : userAvatar} alt={userName} onError={handleError}>
        {avatarTitle}
      </Avatar>
      <Typography variant="subtitle2">{userName}</Typography>
    </Stack>
  )
}
