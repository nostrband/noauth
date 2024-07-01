import { Input } from '@/shared/Input/Input'
import { AppInputProps } from '@/shared/Input/types'
import { Autocomplete, AutocompleteProps, styled } from '@mui/material'
import { forwardRef } from 'react'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import { SubNpubOptionType } from './ModalAppDetails'

export const StyledInput = styled(
  forwardRef<HTMLInputElement, AppInputProps>((props, ref) => <Input {...props} ref={ref} />)
)(() => ({
  '& .MuiAutocomplete-endAdornment': {
    right: '1rem',
  },
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
  '& .input': {
    paddingRight: '1.5rem',
  },
})
