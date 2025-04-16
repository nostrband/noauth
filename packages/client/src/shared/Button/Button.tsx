import { styled, Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material'
import { forwardRef } from 'react'

export type AppButtonProps = MuiButtonProps & {
  varianttype?: 'light' | 'default' | 'dark' | 'secondary'
}

export const Button = forwardRef<HTMLButtonElement, AppButtonProps>(({ children, ...restProps }, ref) => {
  return (
    <StyledButton classes={{ root: 'button', disabled: 'disabled' }} {...restProps} ref={ref}>
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
    '@media screen and (max-width: 320px)': {
      padding: '0.25rem 0.75rem',
    },
    '& .MuiButton-icon.MuiButton-startIcon': {
      marginLeft: 0,
      marginRight: 6,
    },
    '& .MuiButton-icon.MuiButton-endIcon': {
      marginRight: 0,
      marginLeft: 6,
    },
  }
  if (varianttype === 'secondary') {
    return {
      ...commonStyles,
      '&.button:is(:hover, :active, &)': {
        background: theme.palette.backgroundSecondary.default,
      },
      color: theme.palette.text.primary,
      '&.disabled': {
        background: `${theme.palette.backgroundSecondary.default}50`,
        cursor: 'not-allowed',
      },
    }
  }
  return {
    ...commonStyles,
    '&.button:is(:hover, :active, &)': {
      background: theme.palette.primary.main,
    },
    color: theme.palette.text.secondary,
    '&.button.disabled': {
      color: theme.palette.text.secondary,
      background: `${theme.palette.primary.main}75`,
      cursor: 'not-allowed',
    },
  }
})
