import { AppLogo } from '@/assets'
import { Box, styled } from '@mui/material'

export const StyledAppLogo = styled((props) => (
  <Box {...props}>
    <AppLogo />
  </Box>
))({
  background: '#0d0d0d',
  padding: '0.75rem',
  borderRadius: '16px',
  display: 'grid',
  placeItems: 'center',
})
