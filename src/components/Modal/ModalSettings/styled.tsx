import { Button } from '@/shared/Button/Button'
import { Stack, StackProps, Typography, TypographyProps, styled } from '@mui/material'

export const StyledSettingContainer = styled((props: StackProps) => <Stack gap={'0.75rem'} {...props} />)(
  ({ theme }) => ({
    padding: '1rem',
    borderRadius: '1rem',
    background: theme.palette.background.default,
    color: theme.palette.text.primary,
  })
)

export const StyledButton = styled(Button)(({ theme }) => {
  return {
    '&.button:is(:hover, :active, &)': {
      background: theme.palette.secondary.main,
      color: theme.palette.text.primary,
    },
    ':disabled': {
      cursor: 'not-allowed',
    },
  }
})

export const StyledSynchedText = styled((props: TypographyProps & { synced?: 'true' }) => (
  <Typography variant="caption" {...props} />
))(({ theme, synced }) => {
  return {
    color: synced ? theme.palette.success.main : theme.palette.error.main,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  }
})
