import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import QrScanner from 'qr-scanner'
import { useCallback, useEffect, useRef, useState } from 'react'

const NOSTR_CONNECT = 'nostrconnect://'

type useQrReaderProps = {
  videoElement: HTMLVideoElement | null
  qrBoxElement: HTMLDivElement | null
  onScanSuccess?: (data: string) => void
  onClose: () => void
}

type useQrReaderReturnType = {
  isLoading: boolean
}

export const useQrReader = ({
  videoElement,
  qrBoxElement,
  onScanSuccess,
  onClose,
}: useQrReaderProps): useQrReaderReturnType => {
  const notify = useEnqueueSnackbar()
  const scanner = useRef<QrScanner>()

  const [isLoading, setIsLoading] = useState(true)

  const handleCloseQrReader = useCallback(async () => {
    scanner?.current?.stop()
    scanner.current = undefined
  }, [])

  const handleScanSuccess = useCallback(
    (result: QrScanner.ScanResult) => {
      const data = typeof result.data === 'string' ? result.data : ''
      if (!data || !data.startsWith(NOSTR_CONNECT)) return alert('Invalid nostrconnect QR code!')
      onScanSuccess && onScanSuccess(data)
    },
    [onScanSuccess]
  )

  const handleScanFail = (err: string | Error) => {
    console.log(err)
  }

  const handleOpenQrReader = useCallback(async () => {
    try {
      if (videoElement && !scanner.current) {
        scanner.current = new QrScanner(videoElement, handleScanSuccess, {
          onDecodeError: handleScanFail,
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          overlay: qrBoxElement || undefined,
          maxScansPerSecond: 1,
        })

        scanner.current
          ?.start()
          .then(() => setIsLoading(false))
          .catch(() => {
            notify('Permission denied!', 'warning')
            setIsLoading(false)
            onClose()
          })
      }
    } catch (error) {
      console.log(error)
      setIsLoading(false)
    }
  }, [handleScanSuccess, notify, onClose, qrBoxElement, videoElement])

  useEffect(() => {
    return () => {
      handleCloseQrReader()
    }
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    handleOpenQrReader()
  }, [handleOpenQrReader])

  return {
    isLoading,
  }
}
