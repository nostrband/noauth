import { AppButtonProps, Button } from '@/shared/Button/Button'
import { styled } from '@mui/material'

export const StyledButton = styled((props: AppButtonProps) => <Button {...props} />)(() => ({
  borderRadius: '19px',
  fontWeight: 600,
  padding: '0.75rem 1rem',
  maxHeight: '41px',
  minWidth: 'fit-content',
  '@media screen and (max-width: 320px)': {
    minWidth: 'auto',
  },
}))
