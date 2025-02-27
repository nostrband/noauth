import { FC } from 'react'
import { Input } from '@/shared/Input/Input'
import { Stack, Typography } from '@mui/material'
import { useFormContext } from 'react-hook-form'
import { FormInputType } from './const'
import { Button } from '@/shared/Button/Button'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { useUnmount } from 'usehooks-ts'

type ModalEmailLoginContentProps = {
  isLoading: boolean
  onSubmit: (values: FormInputType) => void
  onUnmount: () => void
  inputProps: {
    endAdornment: JSX.Element
    type: string
  }
}

export const ModalEmailLoginContent: FC<ModalEmailLoginContentProps> = ({
  isLoading,
  onSubmit,
  inputProps,
  onUnmount,
}) => {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useFormContext<FormInputType>()

  useUnmount(() => onUnmount())

  return (
    <Stack paddingTop={'1rem'} gap={'1rem'} component={'form'} onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={'0.2rem'} padding={'0 1rem'} alignSelf={'flex-start'}>
        <Typography fontWeight={600} variant="h5">
          Login
        </Typography>
        <Typography noWrap variant="body2" color={'GrayText'}>
          Sync keys from the cloud to this device
        </Typography>
      </Stack>
      <Input
        label="Email address"
        fullWidth
        placeholder="example@mail.com"
        {...register('email')}
        error={!!errors.email}
        type="email"
      />
      <Input
        label="Password"
        fullWidth
        placeholder="Your password"
        {...register('password')}
        {...inputProps}
        error={!!errors.password}
      />

      <Stack gap={'0.5rem'}>
        <Button type="submit" fullWidth disabled={isLoading}>
          Login {isLoading && <LoadingSpinner />}
        </Button>
      </Stack>
    </Stack>
  )
}
