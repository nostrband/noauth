import { AppLogo } from '@/assets'
import { Box, Stack, StackProps, styled } from '@mui/material'
import { forwardRef } from 'react'

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

export const InputsContainer = styled(
  forwardRef<HTMLDivElement, StackProps>((props, ref) => <Stack {...props} ref={ref} />)
)(() => ({
  gap: '1rem',
  '@media screen and (max-width: 485px)': {
    gap: '0.5rem',
  },
}))
