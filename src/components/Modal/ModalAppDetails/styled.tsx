import { AppInputProps, Input } from '@/shared/Input/Input'
import { styled } from '@mui/material'
import { forwardRef } from 'react'

export const StyledInput = styled(
  forwardRef<HTMLInputElement, AppInputProps>((props, ref) => <Input {...props} ref={ref} />)
)(() => ({
  '& .MuiAutocomplete-endAdornment': {
    right: '1rem',
  },
}))
