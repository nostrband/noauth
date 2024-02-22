import { BoxProps, FormHelperTextProps, InputBaseProps } from '@mui/material'
import { ReactNode } from 'react'

export type AppInputProps = InputBaseProps & {
  helperText?: string | ReactNode
  helperTextProps?: FormHelperTextProps
  containerProps?: BoxProps
  label?: string
}
