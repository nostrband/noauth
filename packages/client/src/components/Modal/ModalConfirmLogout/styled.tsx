import { styled, Typography } from '@mui/material'

export const StyledSubtitle = styled(Typography)(({ theme }) => {
  return {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '18px',
    color: theme.palette.textSecondaryDecorate.light,
    textAlign: 'center',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    maxWidth: '328px',
    margin: '0 auto',
  }
})
