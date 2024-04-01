import { Box, BoxProps, styled } from '@mui/material'

export const StyledInputContainer = styled((props: BoxProps & { mode: 'default' | 'light' }) => <Box {...props} />)(({
  theme,
  mode = 'default',
}) => {
  const isDark = theme.palette.mode === 'dark'
  const background = mode === 'light' ? theme.palette.secondary.main : isDark ? '#000000A8' : '#000'

  return {
    width: '100%',
    '& > .input_root': {
      background: background,
      color: mode === 'light' ? theme.palette.primary.main : theme.palette.common.white,
      padding: '0.75rem 1rem',
      borderRadius: '1rem',
      borderWidth: '0.3px',
      borderStyle: 'solid',
      borderColor: mode === 'light' ? 'transparent' : '#FFFFFF54',
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
