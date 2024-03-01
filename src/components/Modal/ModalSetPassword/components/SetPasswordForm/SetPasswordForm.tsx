import { Stack } from '@mui/material'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FormInputType, schema } from './const'
import { Input } from '@/shared/Input/Input'
import { PasswordValidationStatus } from '@/shared/PasswordValidationStatus/PasswordValidationStatus'
import { Button } from '@/shared/Button/Button'
import { usePasswordValidation } from '@/hooks/usePasswordValidation'
import { yupResolver } from '@hookform/resolvers/yup'

const FORM_DEFAULT_VALUES: FormInputType = {
  password: '',
  rePassword: '',
}

export const SetPasswordForm = () => {
  const {
    handleSubmit,
    reset,
    register,
    formState: { errors },
    watch,
  } = useForm<FormInputType>({
    defaultValues: FORM_DEFAULT_VALUES,
    resolver: yupResolver(schema),
    mode: 'onSubmit',
  })

  const enteredPassword = watch('password')

  const { isPasswordInvalid, passwordStrength, reset: resetPasswordValidation } = usePasswordValidation(enteredPassword)

  const submitHandler = (values: FormInputType) => {
    if (isPasswordInvalid) return
    console.log(values)
  }

  useEffect(() => {
    reset()
    resetPasswordValidation()
    // eslint-disable-next-line
  }, [])

  return (
    <Stack component={'form'} onSubmit={handleSubmit(submitHandler)} gap={'1rem'}>
      <Input
        label="Password"
        placeholder="Enter a password"
        {...register('password')}
        error={!!errors.password}
        fullWidth
      />
      <Input
        label="Confirm Password"
        placeholder="Confirm password"
        {...register('rePassword')}
        error={!!errors.rePassword}
        fullWidth
      />
      {!errors?.rePassword?.message && (
        <PasswordValidationStatus
          boxProps={{ sx: { padding: '0 0.5rem' } }}
          isPasswordInvalid={isPasswordInvalid}
          passwordStrength={passwordStrength}
        />
      )}
      <Button type="submit">Save</Button>
    </Stack>
  )
}
