import { FC } from 'react'
import { Warning } from '@/components/Warning/Warning'
import { CircularProgress, Stack, styled, Typography, TypographyProps } from '@mui/material'
import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined'
import { Button } from '@/shared/Button/Button'

type EmailConfirmationWarningProps = {
  isLoading: boolean
  onResend: () => void
  email: string
}

export const EmailConfirmationWarning: FC<EmailConfirmationWarningProps> = ({ isLoading, onResend, email = '' }) => {
  return (
    <Warning
      message={
        <Stack justifyContent={'space-between'} alignItems={'center'} width={'100%'} direction={'row'}>
          <Stack>
            <Typography variant="body1" noWrap fontWeight={'500'} textOverflow={'ellipsis'}>
              Please confirm your email
            </Typography>
            <StyledHint>
              We sent confirmation email to <b>{email}</b>
            </StyledHint>
          </Stack>

          <Button onClick={onResend} disabled={isLoading}>
            Resend
          </Button>
        </Stack>
      }
      icon={
        isLoading ? (
          <CircularProgress size={'1.5rem'} sx={{ color: '#fff' }} />
        ) : (
          <AlternateEmailOutlinedIcon htmlColor="white" />
        )
      }
    />
  )
}

const StyledHint = styled((props: TypographyProps) => <Typography variant="body2" {...props} />)(() => ({
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}))
