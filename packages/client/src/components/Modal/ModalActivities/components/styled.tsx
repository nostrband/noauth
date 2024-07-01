import { Box, BoxProps, styled } from '@mui/material'

export const StyledActivityItem = styled((props: BoxProps) => <Box {...props} />)(() => ({
  display: 'flex',
  gap: '0.5rem',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.25rem',
}))

export const StyledDetails = styled((props: BoxProps) => <Box {...props} />)(({ theme }) => ({
  width: '100%',
  maxHeight: '15rem',
  overflow: 'auto',
  whiteSpace: 'break-spaces',
  fontSize: '14px',
  padding: '0.5rem 1rem',
  background: theme.palette.backgroundSecondary.default,
  borderRadius: '1rem',
  '@media screen and (max-width: 485px)': {
    maxHeight: '10rem',
    fontSize: '12px',
  },
}))
