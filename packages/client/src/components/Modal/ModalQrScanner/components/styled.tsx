import { Box, styled } from '@mui/material'

export const QrBoxContainer = styled(Box)(() => ({
  width: '400px',
  height: '400px',
  overflow: 'hidden',
  margin: '0 auto',
  position: 'relative',

  '& video': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  '& .qr-box': {
    width: '100% !important',
    left: '0 !important',
  },

  '& .qr-frame': {
    position: 'absolute',
    fill: 'none',
    left: '50%',
    top: '50%',
    transform: 'translateX(-50%) translateY(-50%)',
  },

  '@media (max-width: 426px)': {
    width: '100%',
  },
}))
