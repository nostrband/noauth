import { styled, Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material'
import { forwardRef } from 'react'

export type AppButtonProps = MuiButtonProps & {
  varianttype?: 'light' | 'default' | 'dark' | 'secondary'
}

export const Button = forwardRef<HTMLButtonElement, AppButtonProps>(({ children, ...restProps }, ref) => {
  return (
    <StyledButton classes={{ root: 'button' }} {...restProps} ref={ref}>
      {children}
    </StyledButton>
  )
})

const StyledButton = styled(
  forwardRef<HTMLButtonElement, AppButtonProps>((props, ref) => <MuiButton ref={ref} {...props} />)
)(({ theme, varianttype = 'default' }) => {
  const commonStyles = {
    fontWeight: 500,
    borderRadius: '1rem',
  }
  if (varianttype === 'secondary') {
    return {
      ...commonStyles,
      '&.button:is(:hover, :active, &)': {
        background: theme.palette.backgroundSecondary.default,
      },
      color: theme.palette.text.primary,
    }
  }
  return {
    ...commonStyles,
    '&.button:is(:hover, :active, &)': {
      background: theme.palette.primary.main,
    },
    color: theme.palette.text.secondary,
    ':disabled': {
      '&.button:is(:hover, :active, &)': {
        background: theme.palette.backgroundSecondary.default,
      },
      color: theme.palette.backgroundSecondary.paper,
    },
  }
})
