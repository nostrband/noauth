import { Box, Stack, StackProps, styled } from '@mui/material'

export const IconWrapper = styled(Box)({
  height: '26px',
  '& svg': {
    height: '100%',
    aspectRatio: '1/1',
    width: 'max-content',
  },
})

export const Container = styled((props: StackProps) => <Stack {...props} direction={'row'} />)({
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 0',
})
