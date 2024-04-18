import { Box, BoxProps, styled } from '@mui/material'

export const StyledInputContainer = styled((props: BoxProps) => <Box {...props} />)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark'
  const background = isDark ? '#000000A8' : theme.palette.secondary.main

  return {
    width: '100%',
    '& > .input_root': {
      background: background,
      color: theme.palette.primary.main,
      padding: '0.75rem 1rem',
      borderRadius: '1rem',
      borderWidth: '0.3px',
      borderStyle: 'solid',
      borderColor: isDark ? '#FFFFFF54' : '#00000015',
      fontSize: '0.875rem',
      '&.error': {
        border: '1px solid ' + theme.palette.error.main,
      },
      gap: '0.5rem',
    },
    '& .input:is(.disabled, &)': {
      WebkitTextFillColor: '#ffffff80',
    },
    '& > .helper_text': {
      margin: '0.5rem 0.5rem 0',
      color: theme.palette.text.primary,
    },
    '& > .label': {
      margin: '0 1rem 0.5rem',
      display: 'block',
      color: theme.palette.primary.main,
      fontSize: '0.875rem',
    },
    '@media screen and (max-width: 320px)': {
      '& > .input_root': {
        padding: '0.5rem 0.75rem',
        borderRadius: '0.75rem',
      },
      '& > .label': {
        margin: '0 0.25rem 0.25rem',
      },
      '& > .helper_text': {
        fontSize: '0.75rem',
        margin: '0.25rem 0.5rem 0',
      },
    },
  }
})
