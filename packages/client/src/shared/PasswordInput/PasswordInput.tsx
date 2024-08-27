import { forwardRef, useEffect } from 'react'
import { AppInputProps } from '../Input/types'
import { Input } from '../Input/Input'
import { usePassword } from '@/hooks/usePassword'

type PasswordInputProps = AppInputProps

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>((props, ref) => {
  const { inputProps, hidePassword } = usePassword()

  useEffect(() => {
    return () => hidePassword()
    // eslint-disable-next-line
  }, [])

  return <Input {...props} {...inputProps} ref={ref} />
})
