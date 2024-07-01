import { IconButton, Stack, StackProps, styled } from '@mui/material'
import { CopyIcon } from '@/assets'

export const StyledContainer = styled((props: StackProps & { copied: number }) => (
  <Stack {...props} direction={'row'} alignItems={'center'} />
))(({ theme, copied }) => ({
  color: copied ? theme.palette.success.main : theme.palette.textSecondaryDecorate.main,
}))

export const StyledCopyButton = styled((props) => (
  <IconButton color="inherit" {...props}>
    <CopyIcon />
  </IconButton>
))(() => ({
  width: 40,
  height: 40,
  '@media screen and (max-width: 485px)': {
    width: 24,
    height: 24,
    padding: '0.25rem',
  },
}))
