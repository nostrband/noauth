import { AppLogo } from '@/assets'
import { Box, Stack, StackProps, Typography, TypographyProps, styled } from '@mui/material'
import { forwardRef } from 'react'

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

export const Subtitle = styled((props: TypographyProps) => (
  <Typography {...props} variant="body2" color={'GrayText'} />
))(() => ({
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}))

export const Container = styled((props: StackProps) => <Stack {...props} />)(() => ({
  gap: '1rem',
  paddingTop: '1rem',
  '@media screen and (max-width: 485px)': {
    gap: '0.75rem',
  },
}))

export const InputsContainer = styled(
  forwardRef<HTMLDivElement, StackProps>((props, ref) => <Stack {...props} ref={ref} />)
)(() => ({
  gap: '1rem',
  '@media screen and (max-width: 485px)': {
    gap: '0.5rem',
  },
}))
