import { Button, ButtonProps, styled } from '@mui/material'
import GoBackIcon from '@mui/icons-material/KeyboardBackspaceRounded'

export const StyledButton = styled((props: ButtonProps) => (
  <Button
    {...props}
    startIcon={<GoBackIcon />}
    classes={{
      startIcon: 'icon',
    }}
  />
))(({ theme }) => ({
  color: theme.palette.primary.main,
  marginBottom: '0.5rem',
  borderRadius: '8px',
  '&:is(:hover,:active)': {
    textDecoration: 'underline',
  },
  '& .icon': {
    marginRight: '5px',
  },
  '@media screen and (max-width: 320px)': {
    marginBottom: '0.25rem',
  },
}))
