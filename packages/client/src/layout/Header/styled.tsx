import { AppLogo } from '@/assets'
import { AppBar, IconButton, Stack, StackProps, Typography, TypographyProps, styled } from '@mui/material'
import { Link } from 'react-router-dom'

export const StyledAppBar = styled(AppBar)(({ theme }) => {
  return {
    color: theme.palette.primary.main,
    boxShadow: 'none',
    marginBottom: '1rem',
    background: theme.palette.background.default,
    zIndex: 1301,
    maxWidth: 'inherit',
    left: '50%',
    transform: 'translateX(-50%)',
    borderRadius: '8px',
  }
})

export const StyledAppName = styled((props: TypographyProps) => (
  <Typography component={Link} to={'/'} flexGrow={1} {...props} />
))(() => ({
  '&:not(:hover)': {
    textDecoration: 'initial',
  },
  color: 'inherit',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  fontWeight: 600,
  fontSize: '1rem',
  lineHeight: '22.4px',
  marginLeft: '0.5rem',
}))

export const StyledProfileContainer = styled((props: StackProps & { nonclickable: boolean | undefined }) => (
  <Stack {...props} />
))(({ nonclickable }) => ({
  gap: '1rem',
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  '& .avatar': {
    cursor: 'pointer',
  },
  '& .username': {
    cursor: 'pointer',
  },
  '& > *': {
    pointerEvents: nonclickable ? 'none' : 'initial',
  },
}))

export const StyledThemeButton = styled(IconButton)({
  margin: '0 0.5rem',
})

export const StyledAppLogo = styled(AppLogo)(({ theme }) => ({
  '& path': {
    fill: theme.palette.text.primary,
  },
}))
