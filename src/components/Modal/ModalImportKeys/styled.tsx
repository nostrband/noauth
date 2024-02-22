import { AppLogo } from '@/assets'
import { Box, Stack, StackProps, styled } from '@mui/material'

export const StyledAppLogo = styled((props) => (
  <Box {...props}>
    <AppLogo />
  </Box>
))(() => ({
  background: '#0d0d0d',
  padding: '0.75rem',
  borderRadius: '16px',
  display: 'grid',
  placeItems: 'center',
}))

export const HeadingContainer = styled((props: StackProps) => <Stack {...props} />)(() => ({
  gap: '0.2rem',
  padding: '0 1rem',
  alignSelf: 'flex-start',
  overflow: 'auto',
  width: '100%',
  '@media screen and (max-width: 320px)': {
    padding: '0 0.75rem',
  },
}))
