import React from 'react'
import { Box, BoxProps, Typography, TypographyProps } from '@mui/material'
import { PasswordStrength } from '@/hooks/usePasswordValidation'

type PasswordValidationStatusProps = {
  isPasswordInvalid: boolean
  passwordStrength: PasswordStrength | ''
  textVariant?: TypographyProps['variant']
  boxProps?: BoxProps
}

export const PasswordValidationStatus: React.FC<PasswordValidationStatusProps> = ({
  isPasswordInvalid,
  passwordStrength,
  textVariant = 'body2',
  boxProps,
}) => {
  const getStatus = () => {
    if (isPasswordInvalid) {
      return (
        <Typography variant={textVariant} color={'red'}>
          Password must include 6+ English letters, numbers or punctuation marks.
        </Typography>
      )
    }
    if (passwordStrength === 'weak') {
      return (
        <Typography noWrap variant={textVariant} color={'orange'}>
          Weak password
        </Typography>
      )
    }
    if (passwordStrength === 'good') {
      return (
        <Typography noWrap variant={textVariant} color={'green'}>
          Good password
        </Typography>
      )
    }
    return (
      <Typography variant={textVariant} color={'GrayText'}>
        This key will be encrypted and stored on our server. You can use the password to download this key onto another
        device.
      </Typography>
    )
  }
  return <Box {...boxProps}>{getStatus()}</Box>
}
