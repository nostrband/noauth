import { FC } from 'react'
import { Button } from '@/shared/Button/Button'
import { Input } from '@/shared/Input/Input'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { Stack, Typography } from '@mui/material'
import { useFormContext } from 'react-hook-form'
import { FormInputType } from '../../const'

type StepSavePasswordProps = {
  onSubmit: (values: FormInputType) => void
  isLoading: boolean
  inputProps: {
    endAdornment: JSX.Element
    type: string
  }
  email: string
}

export const StepSavePassword: FC<StepSavePasswordProps> = ({ onSubmit, isLoading, inputProps, email }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useFormContext<FormInputType>()

  return (
    <Stack paddingTop={'1rem'} gap={'1rem'} component={'form'} onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Email address"
        fullWidth
        readOnly
        value={email}
        onChange={() => undefined}
        type="email"
        autoComplete="username"
      />
      <Input
        label="Password"
        fullWidth
        placeholder="Your password"
        {...register('password')}
        {...inputProps}
        error={!!errors.password}
        autoComplete="new-password"
      />

      <Typography noWrap variant="body2" color={'GrayText'}>
        Save your password to login later
      </Typography>

      <Stack gap={'0.5rem'}>
        <Button type="submit" fullWidth disabled={isLoading}>
          Continue {isLoading && <LoadingSpinner />}
        </Button>
      </Stack>
    </Stack>
  )
}
