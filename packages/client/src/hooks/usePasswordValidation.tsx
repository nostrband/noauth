import { useCallback, useEffect, useState } from 'react'
import { isValidPassphase, isWeakPassphase } from '@noauth/common'
import { useDebounce } from 'use-debounce'

export type PasswordStrength = 'weak' | 'good'

export const usePasswordValidation = (passwordValue: string) => {
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | ''>('')

  const [debouncedValue] = useDebounce(passwordValue || '', 100)

  useEffect(() => {
    const validPassphase = isValidPassphase(debouncedValue)
    setIsPasswordInvalid(!!debouncedValue && !validPassphase)

    setPasswordStrength(validPassphase ? (isWeakPassphase(debouncedValue) ? 'weak' : 'good') : '')
  }, [debouncedValue])

  const reset = useCallback(() => {
    setPasswordStrength('')
    setIsPasswordInvalid(false)
  }, [])

  return {
    isPasswordInvalid,
    setIsPasswordInvalid,
    passwordStrength,
    reset,
  }
}
