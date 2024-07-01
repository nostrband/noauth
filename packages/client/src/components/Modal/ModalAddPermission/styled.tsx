import { Input } from '@/shared/Input/Input'
import {
  Autocomplete,
  AutocompleteProps,
  Select,
  SelectProps,
  Switch,
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

export const StyledSwitch = styled(Switch)(({ theme }) => ({
  width: 28,
  height: 16,
  padding: 0,
  display: 'flex',
  '&:active': {
    '& .MuiSwitch-thumb': {
      width: 15,
    },
    '& .MuiSwitch-switchBase.Mui-checked': {
      transform: 'translateX(9px)',
    },
  },
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      transform: 'translateX(12px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: theme.palette.mode === 'dark' ? '#177ddc' : '#1890ff',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
    width: 12,
    height: 12,
    borderRadius: 6,
    transition: theme.transitions.create(['width'], {
      duration: 200,
    }),
  },
  '& .MuiSwitch-track': {
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.25)',
    boxSizing: 'border-box',
  },
}))
