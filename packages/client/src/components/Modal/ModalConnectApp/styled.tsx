import { AppButtonProps, Button } from '@/shared/Button/Button'
import {
  Autocomplete,
  AutocompleteProps,
  IconButton,
  IconButtonProps,
  Stack,
  styled,
  Typography,
  TypographyProps,
} from '@mui/material'
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest'
import { Input } from '@/shared/Input/Input'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import { SubNpubOptionType } from './utils/types'
import { forwardRef } from 'react'
import { AppInputProps } from '@/shared/Input/types'

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

export const InputGroupContainer = styled(Stack)({
  gap: '0.25rem',
  alignItems: 'center',
  width: '100%',
})

export const InputDescriptionContainer = styled(Stack)({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '0.25rem',
  padding: '0 0.5rem',
  width: '100%',
})

export const StyledInput = styled(
  forwardRef<HTMLInputElement, AppInputProps>((props, ref) => <Input {...props} ref={ref} fullWidth />)
)({ gap: '0.5rem' })

export const StyledInputHelperText = styled((props: TypographyProps) => (
  <Typography {...props} variant="body2" color={'GrayText'} />
))({
  fontSize: 12,
})

export const StyledIconButton = styled((props: IconButtonProps) => <IconButton color="inherit" {...props} />)(
  ({ theme }) => ({
    width: 40,
    height: 40,
    '@media screen and (max-width: 485px)': {
      width: 24,
      height: 24,
      padding: '0.25rem',
    },
    color: theme.palette.textSecondaryDecorate.main,
  })
)
