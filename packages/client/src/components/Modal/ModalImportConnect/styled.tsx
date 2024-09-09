import { Stack, StackProps, styled, Typography, TypographyProps } from '@mui/material'

export const Container = styled((props: StackProps) => <Stack {...props} />)(() => ({
  gap: '1rem',
  '@media screen and (max-width: 485px)': {
    gap: '0.75rem',
  },
}))

export const HeadingContainer = styled((props: StackProps) => <Stack {...props} />)(() => ({
  gap: '0.2rem',
  padding: '0 1rem',
  alignSelf: 'flex-start',
  overflow: 'auto',
  width: '100%',
  '@media screen and (max-width: 320px)': {
    padding: '0 0.5rem',
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

export const StyledText = styled((props: TypographyProps) => <Typography {...props} noWrap />)(() => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}))

export const InputsContainer = styled((props: StackProps) => <Stack {...props} />)(() => ({
  gap: '1rem',
  '@media screen and (max-width: 485px)': {
    gap: '0.5rem',
  },
}))
