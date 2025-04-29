import { Box, Fab, styled } from '@mui/material'

export const PositionContainer = styled(Box)(() => {
  return {
    position: 'fixed',
    bottom: 16,
    right: 16,
    '@media screen and (max-width: 485px)': {
      bottom: 8,
      right: 8,
    },
  }
})

export const StyledFab = styled(Fab)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark'
  return {
    borderRadius: '16px',
    background: theme.palette.backgroundSecondary.paper,
    color: isDark ? '#FFFFFFA8' : 'initial',
    width: 42,
    height: 42,
  }
})
