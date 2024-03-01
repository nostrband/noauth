import { useEffect } from 'react'
import { Stack } from '@mui/material'
import { FormInputType, schema } from './const'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { usePasswordValidation } from '@/hooks/usePasswordValidation'
import { Input } from '@/shared/Input/Input'
import { PasswordValidationStatus } from '@/shared/PasswordValidationStatus/PasswordValidationStatus'
import { Button } from '@/shared/Button/Button'

const FORM_DEFAULT_VALUES: FormInputType = {
  existingPassword: '',
  password: '',
  rePassword: '',
}

export const ChangePasswordForm = () => {
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

  const newPassword = watch('password')
  const { isPasswordInvalid, passwordStrength, reset: resetPasswordValidation } = usePasswordValidation(newPassword)

  const submitHandler = async (values: FormInputType) => {
    if (isPasswordInvalid) return
    try {
      console.log(values)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    reset()
    resetPasswordValidation()
    // eslint-disable-next-line
  }, [])

  return (
    <Stack component={'form'} onSubmit={handleSubmit(submitHandler)} gap={'1rem'}>
      <Input
        label="Current Password"
        placeholder="Enter current password"
        {...register('existingPassword')}
        error={!!errors.existingPassword}
        fullWidth
      />
      <Input
        label="New Password"
        placeholder="Enter a new password"
        {...register('password')}
        error={!!errors.password}
        fullWidth
      />
      <Input
        label="Confirm Password"
        placeholder="Confirm new password"
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
