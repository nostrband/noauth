import { FC, useCallback, useEffect, useState } from 'react'
import { Stack, Typography } from '@mui/material'
import { FormInputType, schema } from './const'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { usePasswordValidation } from '@/hooks/usePasswordValidation'
import { PasswordValidationStatus } from '@/shared/PasswordValidationStatus/PasswordValidationStatus'
import { Button } from '@/shared/Button/Button'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useParams } from 'react-router-dom'
import { swicCall } from '@/modules/swic'
import { dbi } from '@/modules/db'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { Input } from '@/shared/Input/Input'
import { usePassword } from '@/hooks/usePassword'

const FORM_DEFAULT_VALUES: FormInputType = {
  existingPassword: '',
  password: '',
  rePassword: '',
}

type ChangePasswordFormProps = {
  onClose: () => void
}

export const ChangePasswordForm: FC<ChangePasswordFormProps> = ({ onClose }) => {
  const notify = useEnqueueSnackbar()
  const { npub = '' } = useParams<{ npub: string }>()
  const [isLoading, setIsLoading] = useState(false)

  const { hidePassword, inputProps } = usePassword()
  const { hidePassword: hideNewPassword, inputProps: newPasswordProps } = usePassword()
  const { hidePassword: hideRePassword, inputProps: rePasswordProps } = usePassword()

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

  const resetPasswordInputs = useCallback(() => {
    hidePassword()
    hideNewPassword()
    hideRePassword()
  }, [hideNewPassword, hidePassword, hideRePassword])

  const submitHandler = async (values: FormInputType) => {
    if (isPasswordInvalid) return
    setIsLoading(true)
    resetPasswordInputs()
    try {
      const { password, existingPassword } = values
      if (!existingPassword.trim() || !password.trim()) throw new Error('Please fill out all fields!')

      await swicCall('setPassword', npub, password, existingPassword)
      setIsLoading(false)
      notify('Password has been successfully updated', 'success')
      onClose()
    } catch (error: any) {
      notify(error.toString() || 'Failed to update a password', 'error')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    reset()
    resetPasswordValidation()
    setIsLoading(false)
    resetPasswordInputs()
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
        containerProps={{ sx: { marginBottom: '1rem' } }}
        {...inputProps}
      />
      <Input
        label="New Password"
        placeholder="Enter a new password"
        {...register('password')}
        error={!!errors.password}
        fullWidth
        {...newPasswordProps}
      />
      <Input
        label="Confirm Password"
        placeholder="Confirm new password"
        {...register('rePassword')}
        error={!!errors.rePassword}
        fullWidth
        {...rePasswordProps}
      />
      {Object.values(errors).length === 0 && (
        <PasswordValidationStatus
          boxProps={{ sx: { padding: '0 0.5rem' } }}
          isPasswordInvalid={isPasswordInvalid}
          passwordStrength={passwordStrength}
        />
      )}
      {Object.values(errors).length > 0 && (
        <Typography variant="body2" color={'red'} padding={'0 0.5rem'}>
          {Object.values(errors)[0].message}
        </Typography>
      )}
      <Button type="submit" disabled={isLoading}>
        Save {isLoading && <LoadingSpinner />}
      </Button>
    </Stack>
  )
}
