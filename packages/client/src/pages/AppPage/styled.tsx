import { Box, BoxProps, Stack, StackProps, styled } from '@mui/material'

export const HeadingContainer = styled((props: StackProps) => <Stack {...props} />)(() => ({
  width: '100%',
  marginBottom: '1rem',
  flexDirection: 'row',
  gap: '1rem',
  alignItems: 'center',
  '@media screen and (max-width: 320px)': {
    flexDirection: 'column',
    gap: '0.5rem',
  },
}))

export const AppInfoContainer = styled((props: StackProps) => <Stack {...props} direction={'row'} />)(() => ({
  width: '100%',
  flex: 1,
  alignItems: 'flex-start',
  gap: '0.5rem',
  marginBottom: '0.5rem',
  overflow: 'hidden',
  '@media screen and (max-width: 320px)': {
    alignSelf: 'flex-start',
  },
}))

export const AppNameContainer = styled((props: BoxProps) => <Box {...props} />)(() => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflow: 'auto',
}))
