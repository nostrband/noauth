import { FC, useEffect } from 'react'
import { Stack, Typography } from '@mui/material'
import { FormInputType, schema } from './const'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { usePasswordValidation } from '@/hooks/usePasswordValidation'
import { Input } from '@/shared/Input/Input'
import { PasswordValidationStatus } from '@/shared/PasswordValidationStatus/PasswordValidationStatus'
import { Button } from '@/shared/Button/Button'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useParams } from 'react-router-dom'
import { swicCall } from '@/modules/swic'
import { dbi } from '@/modules/db'

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
      const { password, existingPassword } = values
      if (!existingPassword.trim() || !password.trim()) throw new Error('Please fill out all fields!')

      await swicCall('setPassword', npub, password, existingPassword)
      dbi.addSynced(npub)
      notify('Password has been successfully updated', 'success')
      onClose()
    } catch (error: any) {
      notify(error?.message || 'Failed to update a password', 'error')
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
      <Button type="submit">Save</Button>
    </Stack>
  )
}
