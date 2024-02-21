import { Input } from '@/shared/Input/Input'
import { AppInputProps } from '@/shared/Input/types'
import { Stack, StackProps, styled } from '@mui/material'
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

export const StyledItemAppContainer = styled(<C extends React.ElementType>(props: StackProps<C, { component?: C }>) => (
  <Stack {...props} />
))(({ theme }) => ({
  textDecoration: 'none',
  boxShadow: 'none',
  color: theme.palette.text.primary,
  background: theme.palette.backgroundSecondary.default,
  borderRadius: '12px',
  padding: '0.5rem 1rem',
  ':hover': {
    background: `${theme.palette.backgroundSecondary.default}95`,
  },
}))
