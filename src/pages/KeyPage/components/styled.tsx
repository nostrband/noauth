import { Input } from '@/shared/Input/Input'
import { AppInputProps } from '@/shared/Input/types'
import { styled } from '@mui/material'
import { forwardRef } from 'react'

export const StyledInput = styled(
  forwardRef<HTMLInputElement, AppInputProps>(({ className, ...props }, ref) => {
    return (
      <Input
        {...props}
        ref={ref}
        className="input"
        containerProps={{
          className,
        }}
        fullWidth
      />
    )
  })
)(({ theme }) => ({
  '& > .input': {
    border: 'none',
    background: theme.palette.secondary.main,
    color: theme.palette.primary.main,
    '& .adornment': {
      color: theme.palette.primary.main,
    },
  },
}))
