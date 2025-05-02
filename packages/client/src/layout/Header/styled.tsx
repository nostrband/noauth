import { AppLogo } from '@/assets'
import { IconButton, Stack, StackProps, Toolbar, Typography, TypographyProps, styled } from '@mui/material'
import { CSSProperties, HTMLAttributes } from 'react'
import { Link } from 'react-router-dom'

type StyledAppBarProps = HTMLAttributes<HTMLDivElement> & {
  position: CSSProperties['position']
}

export const StyledAppBar = styled((props: StyledAppBarProps) => <header {...props} />)(({
  theme,
  position = 'fixed',
}) => {
  return {
    color: theme.palette.primary.main,
    boxShadow: 'none',
    marginBottom: '1rem',
    background: theme.palette.background.default,
    zIndex: 1301,
    maxWidth: '900px',
    left: '50%',
    transform: 'translateX(-50%)',
    borderRadius: '8px',
    position: position,
    width: '100%',
  }
})

export const StyledToolbar = styled(Toolbar)(() => ({
  padding: '12px 24px',
  '@media screen and (max-width: 485px)': {
    padding: '8px 12px',
  },
}))

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
    cursor: nonclickable ? 'default' : 'pointer',
  },
  '& .username': {
    cursor: nonclickable ? 'default' : 'pointer',
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
