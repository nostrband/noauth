import { AppButtonProps, Button } from '@/shared/Button/Button'
import { styled } from '@mui/material'
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest'

export const StyledAdvancedButton = styled((props: AppButtonProps) => (
  <Button {...props} startIcon={<SettingsSuggestIcon sx={{ marginTop: '-2px' }} />} />
))(({ theme }) => ({
  padding: '0.25rem 1rem',
  '&.button:is(:hover, :active, &)': {
    backgroundColor: theme.palette.secondary.main,
  },
  color: theme.palette.text.primary,
}))
