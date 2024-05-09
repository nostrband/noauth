import { useState, useEffect } from 'react'

/**
 * Custom hook to detect if the platform is iOS or not.
 * @returns {boolean} True if the platform is iOS, false otherwise.
 */

const iOSRegex = /iPad|iPhone|iPod/

function useIsIOS() {
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const isIOSUserAgent =
      iOSRegex.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    setIsIOS(isIOSUserAgent)
  }, [])

  return isIOS
}

export default useIsIOS
