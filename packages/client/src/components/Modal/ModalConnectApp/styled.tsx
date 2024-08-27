import { AppButtonProps, Button } from '@/shared/Button/Button'
import { Autocomplete, AutocompleteProps, styled } from '@mui/material'
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest'
import { SubNpubOptionType } from './ModalConnectApp'
import { Input } from '@/shared/Input/Input'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'

export const StyledAdvancedButton = styled((props: AppButtonProps) => (
  <Button {...props} startIcon={<SettingsSuggestIcon sx={{ marginTop: '-2px' }} />} />
))(({ theme }) => ({
  padding: '0.25rem 1rem',
  '&.button:is(:hover, :active, &)': {
    backgroundColor: theme.palette.backgroundSecondary.default,
  },
  color: theme.palette.text.primary,
}))

export const StyledAutocomplete = styled(
  (props: Omit<AutocompleteProps<SubNpubOptionType, false, false, true>, 'renderInput'>) => (
    <Autocomplete<SubNpubOptionType, false, false, true>
      {...props}
      selectOnFocus
      clearOnBlur
      freeSolo
      renderInput={({ inputProps, disabled, id, InputProps }) => {
        return (
          <Input
            {...InputProps}
            className="input"
            inputProps={inputProps}
            disabled={disabled}
            label="Shared access with"
            fullWidth
            placeholder="npub1..."
          />
        )
      }}
      clearIcon={<ClearRoundedIcon fontSize="small" />}
      classes={{
        endAdornment: 'icon',
      }}
    />
  )
)({
  '& .icon': {
    right: '1rem',
  },
  '& .input': {
    paddingRight: '1.5rem',
  },
})
