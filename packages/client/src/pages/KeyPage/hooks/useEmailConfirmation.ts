import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { client } from '@/modules/client'
import { DbKey } from '@noauth/common'
import { useCallback, useEffect, useState } from 'react'

type useEmailConfirmationReturnType = {
  showWarning: boolean
  handleResendConfirmation: () => void
  isLoading: boolean
}

export const useEmailConfirmation = (key: DbKey | undefined): useEmailConfirmationReturnType => {
  const notify = useEnqueueSnackbar()

  const [showWarning, setShowWarning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckEmailStatus = useCallback(async () => {
    if (!key) return

    try {
      const { npub, email = '' } = key || {}
      const status = await client.checkEmailStatus(npub, email)
      if (!status && email) setShowWarning(true)
      else setShowWarning(false)
    } catch (error) {
      console.log('Error checkEmailStatus:', error)
    }
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    handleCheckEmailStatus()
  }, [handleCheckEmailStatus])

  const handleResendConfirmation = async () => {
    try {
      if (!key || isLoading) return

      setIsLoading(true)
      const { npub, email = '' } = key || {}
      await client.setEmail(npub, email)
      notify('Confirmation code successfully sent!', 'success')
      setIsLoading(false)
    } catch (error: any) {
      notify('Error ' + error.toString(), 'error')
      setIsLoading(false)
    }
  }

  return {
    showWarning,
    handleResendConfirmation,
    isLoading,
  }
}
