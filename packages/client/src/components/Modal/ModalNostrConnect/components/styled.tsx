import { Stack, StackProps, styled, Typography, TypographyProps } from '@mui/material'

export const StyledKeyContainer = styled((props: StackProps) => (
  <Stack marginBottom={'0.5rem'} gap={'0.25rem'} {...props} />
))(({ theme }) => {
  return {
    borderRadius: '12px',
    padding: '0.5rem 1rem',
    background: theme.palette.background.paper,
    ':hover': {
      background: `${theme.palette.background.paper}95`,
    },
    cursor: 'pointer',
  }
})

export const StyledText = styled((props: TypographyProps) => <Typography {...props} />)({
  fontWeight: 500,
  width: '100%',
  wordBreak: 'break-all',
})
