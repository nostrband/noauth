import { StackProps, styled, Stack } from '@mui/material'

export const StyledSectionContainer = styled((props: StackProps) => <Stack gap={'0.75rem'} {...props} />)(
  ({ theme }) => ({
    padding: '1rem',
    borderRadius: '1rem',
    background: theme.palette.background.default,
    color: theme.palette.text.primary,
  })
)
