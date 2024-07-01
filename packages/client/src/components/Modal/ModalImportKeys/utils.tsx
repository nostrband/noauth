import { CheckmarkIcon } from '@/assets'
import { Theme } from '@mui/material'
import { Fragment } from 'react'

export const getNameHelperTextProps = (
  enteredUsername = '',
  nameNpub = '',
  isValidName = false,
  isTakenByNsec = false,
  isBadNsec = false,
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

  if (isTakenByNsec)
    return {
      value: 'Name matches your key',
      color: theme.palette.success.main,
    }
  if (isBadNsec)
    return {
      value: 'Invalid nsec',
      color: theme.palette.error.main,
    }
  if (nameNpub)
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

export const getNsecHelperTextProps = (isBadNsec = false, error: string | undefined, theme: Theme) => {
  if (error) {
    return {
      value: error,
      color: theme.palette.error.main,
    }
  }
  if (isBadNsec)
    return {
      value: 'Invalid nsec',
      color: theme.palette.error.main,
    }
  return {
    value: 'Keys stay on your device.',
    color: theme.palette.textSecondaryDecorate.main,
  }
}
