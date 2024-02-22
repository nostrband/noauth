import { Box, BoxProps, styled } from '@mui/material'

export const StyledContainer = styled((props: BoxProps) => <Box {...props} />)(() => {
  return {
    borderRadius: '4px',
    border: '1px solid grey',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
  }
})

export const IconContainer = styled((props: BoxProps) => <Box {...props} />)(() => ({
  width: '40px',
  minWidth: '40px',
  height: '40px',
  borderRadius: '50%',
  background: 'grey',
  display: 'grid',
  placeItems: 'center',
}))
