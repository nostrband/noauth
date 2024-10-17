import { FC } from 'react'
import { DbKey } from '@noauth/common'
import { StyledKeyContainer, StyledText } from './styled'
import { Avatar, Stack } from '@mui/material'
import { useProfile } from '@/hooks/useProfile'

type ItemKeyProps = DbKey & {
  onKeyClick: () => void
}

export const ItemKey: FC<ItemKeyProps> = ({ npub, onKeyClick }) => {
  const { userName, userAvatar, avatarTitle } = useProfile(npub)

  return (
    <StyledKeyContainer onClick={onKeyClick}>
      <Stack direction={'row'} alignItems={'center'} gap="1rem">
        <Avatar src={userAvatar} alt={userName}>
          {avatarTitle}
        </Avatar>
        <StyledText variant="body1">{userName}</StyledText>
      </Stack>
    </StyledKeyContainer>
  )
}
