import { ReactNode, forwardRef } from 'react'
import { FormHelperText, FormLabel, InputBase, useTheme } from '@mui/material'
import { StyledInputContainer } from './styled'
import { AppInputProps } from './types'

const renderItem = <T,>(item: T, value: ReactNode) => (item ? value : null)

export const Input = forwardRef<HTMLInputElement, AppInputProps>(
  ({ helperText, containerProps, helperTextProps, helperTextColor, label, error, mode = 'default', ...props }, ref) => {
    const theme = useTheme()
    return (
      <StyledInputContainer {...containerProps} mode={mode}>
        {renderItem(
          label,
          <FormLabel className="label" htmlFor={props.id}>
            {label}
          </FormLabel>
        )}

        <InputBase
          autoComplete="off"
          {...props}
          classes={{ error: 'error', root: 'input_root', input: 'input', disabled: 'disabled' }}
          ref={ref}
          error={error}
        />
        {renderItem(
          helperText,
          <FormHelperText
            error={error}
            {...helperTextProps}
            sx={{
              '&.helper_text': {
                color: helperTextColor || theme.palette.text.primary,
              },
            }}
            className="helper_text"
          >
            {helperText}
          </FormHelperText>
        )}
      </StyledInputContainer>
    )
  }
)
