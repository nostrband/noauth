import React, { FC, useCallback, useEffect, useState } from 'react'
import { Stack, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { FormInputType, schema } from './const'
import { PasswordValidationStatus } from '@/shared/PasswordValidationStatus/PasswordValidationStatus'
import { Button } from '@/shared/Button/Button'
import { usePasswordValidation } from '@/hooks/usePasswordValidation'
import { yupResolver } from '@hookform/resolvers/yup'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useParams } from 'react-router-dom'
import { swicCall } from '@/modules/swic'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { Input } from '@/shared/Input/Input'
import { usePassword } from '@/hooks/usePassword'

const FORM_DEFAULT_VALUES: FormInputType = {
  password: '',
  rePassword: '',
}

type SetPasswordFormProps = {
  onClose: () => void
}

export const SetPasswordForm: FC<SetPasswordFormProps> = ({ onClose }) => {
  const notify = useEnqueueSnackbar()
  const { npub = '' } = useParams<{ npub: string }>()
  const [isLoading, setIsLoading] = useState(false)
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

  const enteredPassword = watch('password')

  const resetPasswordInputs = useCallback(() => {
    hideNewPassword()
    hideRePassword()
  }, [hideNewPassword, hideRePassword])

  const { isPasswordInvalid, passwordStrength, reset: resetPasswordValidation } = usePasswordValidation(enteredPassword)

  const submitHandler = async (values: FormInputType) => {
    if (isPasswordInvalid) return
    setIsLoading(true)
    resetPasswordInputs()
    try {
      const { password } = values
      await swicCall('setPassword', npub, password)
      setIsLoading(false)
      notify('Password has been successfully set', 'success')
      onClose()
    } catch (error: any) {
      notify(error.toString() || 'Failed to set a password', 'error')
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
        label="Password"
        placeholder="Enter a password"
        {...register('password')}
        error={!!errors.password}
        fullWidth
        {...newPasswordProps}
      />
      <Input
        label="Confirm Password"
        placeholder="Confirm password"
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
        Submmit {isLoading && <LoadingSpinner />}
      </Button>
    </Stack>
  )
}
