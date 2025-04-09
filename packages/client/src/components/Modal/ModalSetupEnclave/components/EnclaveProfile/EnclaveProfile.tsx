import { FC, useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { Avatar, Stack, Typography } from '@mui/material'
import { nip19 } from 'nostr-tools'

type EnclaveProfileProps = {
  pubkey: string
}

export const EnclaveProfile: FC<EnclaveProfileProps> = (props) => {
  const npub = nip19.npubEncode(props.pubkey)
  const { avatarTitle, userAvatar, userName } = useProfile(npub)
  const [isFailed, setIsFailed] = useState(false)

  const handleError = () => setIsFailed(true)

  return (
    <Stack direction={'row'} gap={'0.5rem'} alignItems={'center'}>
      <Avatar src={isFailed ? '/' : userAvatar} alt={userName} onError={handleError}>
        {avatarTitle}
      </Avatar>
      <Typography variant="subtitle2">{userName}</Typography>
    </Stack>
  )
}
