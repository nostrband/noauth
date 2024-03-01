import { Box, BoxProps, styled } from '@mui/material'

export const StyledInputContainer = styled((props: BoxProps) => <Box {...props} />)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark'
  return {
    width: '100%',
    '& > .input_root': {
      background: isDark ? '#000000A8' : '#000',
      color: theme.palette.common.white,
      padding: '0.75rem 1rem',
      borderRadius: '1rem',
      border: '0.3px solid #FFFFFF54',
      fontSize: '0.875rem',
      '&.error': {
        border: '1px solid ' + theme.palette.error.main,
      },
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
