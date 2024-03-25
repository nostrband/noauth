import { Input } from '@/shared/Input/Input'
import { Select, SelectProps, Typography, TypographyProps, styled } from '@mui/material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'

export const StyledPlaceholder = styled((props: TypographyProps) => (
  <Typography {...props} variant="body2" color={'GrayText'} />
))({})

export const StyledSelect = styled(({ label, ...props }: SelectProps & { label: string }) => (
  <Select
    {...props}
    input={<Input fullWidth label={label} />}
    endAdornment={<ArrowDropDownIcon htmlColor="white" />}
    displayEmpty
  />
))({}) as unknown as typeof Select
