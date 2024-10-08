import { FC } from 'react'
import { Avatar, Stack, StackProps, Typography, TypographyProps, styled } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile'
import { DbKey } from '@noauth/common'

type ItemKeyProps = DbKey

export const ItemKey: FC<ItemKeyProps> = (props) => {
  const { npub } = props
  const navigate = useNavigate()
  const { userName, userAvatar, avatarTitle } = useProfile(npub)

  const handleNavigate = () => {
    navigate('/key/' + npub)
  }

  return (
    <StyledKeyContainer onClick={handleNavigate}>
      <Stack direction={'row'} alignItems={'center'} gap="1rem">
        <Avatar src={userAvatar} alt={userName}>
          {avatarTitle}
        </Avatar>
        <StyledText variant="body1">{userName}</StyledText>
      </Stack>
    </StyledKeyContainer>
  )
}

const StyledKeyContainer = styled((props: StackProps) => <Stack marginBottom={'0.5rem'} gap={'0.25rem'} {...props} />)(
  ({ theme }) => {
    return {
      boxShadow:
        theme.palette.mode === 'dark' ? '0px 1px 6px 0px rgba(92, 92, 92, 0.2)' : '0px 1px 6px 0px rgba(0, 0, 0, 0.2)',
      borderRadius: '12px',
      padding: '0.5rem 1rem',
      background: theme.palette.background.paper,
      ':hover': {
        background: `${theme.palette.background.paper}95`,
      },
      cursor: 'pointer',
    }
  }
)

export const StyledText = styled((props: TypographyProps) => <Typography {...props} />)({
  fontWeight: 500,
  width: '100%',
  wordBreak: 'break-all',
})
