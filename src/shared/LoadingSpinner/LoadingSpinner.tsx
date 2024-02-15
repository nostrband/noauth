import { CircularProgress, CircularProgressProps, styled } from '@mui/material'
import { FC } from 'react'

type LoadingSpinnerProps = CircularProgressProps & {
  mode?: 'default' | 'secondary'
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = (props) => {
  return <StyledCircularProgress {...props} />
}

export const StyledCircularProgress = styled((props: LoadingSpinnerProps) => (
  <CircularProgress size={'1rem'} {...props} />
))(({ theme, mode = 'default' }) => ({
  marginLeft: '0.5rem',
  color: mode === 'default' ? theme.palette.text.secondary : theme.palette.text.primary,
}))
