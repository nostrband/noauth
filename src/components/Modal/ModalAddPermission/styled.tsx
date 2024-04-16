import { Input } from '@/shared/Input/Input'
import {
  Autocomplete,
  AutocompleteProps,
  Select,
  SelectProps,
  Typography,
  TypographyProps,
  styled,
} from '@mui/material'
import { KindOptionType } from './ModalAddPermission'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'

export const StyledPlaceholder = styled((props: TypographyProps) => (
  <Typography {...props} variant="body2" color={'GrayText'} />
))({})

export const StyledSelect = styled(({ label, ...props }: SelectProps & { label: string }) => (
  <Select {...props} input={<Input fullWidth label={label} />} displayEmpty />
))(({ theme }) => ({})) as unknown as typeof Select

export const StyledAutocomplete = styled(
  (props: Omit<AutocompleteProps<KindOptionType, false, false, true>, 'renderInput'>) => (
    <Autocomplete<KindOptionType, false, false, true>
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
            label="Event kind"
            fullWidth
            placeholder="Kind number"
          />
        )
      }}
      clearIcon={<ClearRoundedIcon htmlColor="white" fontSize="small" />}
      classes={{
        endAdornment: 'icon',
      }}
    />
  )
)({
  '& .icon': {
    right: '1rem',
  },
})
