import { CheckmarkIcon } from '@/assets'
import { Theme } from '@mui/material'
import { Fragment } from 'react'

export const getNameHelperTextProps = (
  enteredUsername = '',
  isChecking = false,
  isAvailable = false,
  isValidName = false,
  error: string | undefined,
  theme: Theme
) => {
  if (error) {
    return {
      value: error,
      color: theme.palette.error.main,
    }
  }
  if (!enteredUsername.trim())
    return {
      value: "Don't worry, username can be changed later.",
      color: theme.palette.textSecondaryDecorate.main,
    }
  if (isChecking)
    return {
      value: 'Loading...',
      color: theme.palette.textSecondaryDecorate.main,
    }

  if (!isAvailable)
    return {
      value: 'Already taken',
      color: theme.palette.error.main,
    }

  if (!isValidName)
    return {
      value: 'Invalid name',
      color: theme.palette.error.main,
    }

  return {
    value: (
      <Fragment>
        <CheckmarkIcon /> Available
      </Fragment>
    ),
    color: theme.palette.success.main,
  }
}
