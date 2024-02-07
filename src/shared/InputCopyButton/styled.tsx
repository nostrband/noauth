import { Stack, StackProps, styled } from '@mui/material'

export const StyledContainer = styled((props: StackProps & { copied: number }) => (
  <Stack {...props} direction={'row'} alignItems={'center'} />
))(({ theme, copied }) => ({
  color: copied ? theme.palette.success.main : theme.palette.textSecondaryDecorate.main,
}))
