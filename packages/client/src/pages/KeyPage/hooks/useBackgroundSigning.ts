import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { swr } from '@/modules/swic'
import { client } from '@/modules/client'
import { askNativeNotificationPermission, askNotificationPermission } from '@/utils/helpers/helpers'
import { useState, useEffect, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
// import { PushNotifications } from '@capacitor/push-notifications'

const isIOSPlatform = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'

export const useBackgroundSigning = () => {
  const [showWarning, setShowWarning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const notify = useEnqueueSnackbar()

  const checkBackgroundSigning = useCallback(async () => {
    // if (isIOSPlatform()) {
    //   const permissionsStatus = await PushNotifications.checkPermissions()
    //   if (permissionsStatus.receive !== 'granted') return setShowWarning(true)
    //   PushNotifications.addListener('registration', (token) => {
    //     setShowWarning(!token)
    //   })
    //   await PushNotifications.register()

    //   return
    // }

    if (!swr) return
    const isBackgroundEnable = await swr.pushManager?.getSubscription()

    setShowWarning(!isBackgroundEnable)
  }, [])

  const handleEnableBackground = useCallback(async () => {
    setIsLoading(true)
    try {
      if (isIOSPlatform()) {
        console.log('asking...')
        await askNativeNotificationPermission()
        console.log('asked')

        const result = await client.enablePush()
        if (!result) throw new Error('Failed to activate the push subscription')
        notify('Background service enabled!', 'success')
        setShowWarning(false)

        // END
      } else {
        console.log('asking...')
        await askNotificationPermission()
        console.log('asked')
        const result = await client.enablePush()
        if (!result) throw new Error('Failed to activate the push subscription')
        notify('Background service enabled!', 'success')
        setShowWarning(false)
      }
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
