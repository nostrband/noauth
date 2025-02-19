import { Button } from '@/shared/Button/Button'
import { List, ListItem, Stack, StackProps, styled } from '@mui/material'

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

export const StyledRelaysList = styled(List)(() => {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  }
})

export const StyledListItem = styled(ListItem)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark'
  const background = isDark ? '#000000A8' : theme.palette.secondary.main
  return {
    background,
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '16.94px',
    padding: '0.75rem 1rem',
  }
})
