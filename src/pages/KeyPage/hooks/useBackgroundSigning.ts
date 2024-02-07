import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { swicCall, swr } from '@/modules/swic'
import { askNotificationPermission } from '@/utils/helpers/helpers'
import { useState, useEffect, useCallback } from 'react'

export const useBackgroundSigning = () => {
  const [showWarning, setShowWarning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const notify = useEnqueueSnackbar()

  const checkBackgroundSigning = useCallback(async () => {
    if (!swr) return undefined
    const isBackgroundEnable = await swr.pushManager.getSubscription()
    setShowWarning(!isBackgroundEnable)
  }, [])

  const handleEnableBackground = useCallback(async () => {
    setIsLoading(true)
    try {
      await askNotificationPermission()
      const result = await swicCall('enablePush')
      if (!result) throw new Error('Failed to activate the push subscription')
      notify('Background service enabled!', 'success')
      setShowWarning(false)
    } catch (error: any) {
      notify(`Failed to enable push subscription: ${error}`, 'error')
    }
    setIsLoading(false)
    checkBackgroundSigning()
  }, [notify, checkBackgroundSigning])

  useEffect(() => {
    checkBackgroundSigning()
  }, [checkBackgroundSigning])

  return { showWarning, isEnabling: isLoading, handleEnableBackground }
}
