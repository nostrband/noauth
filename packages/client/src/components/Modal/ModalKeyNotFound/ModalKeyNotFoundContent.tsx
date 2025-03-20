import { FC, useMemo } from 'react'
import { Box, Stack, Typography, useMediaQuery } from '@mui/material'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import ShareIcon from '@mui/icons-material/Share'
import { Button } from '@/shared/Button/Button'
import { useCopyToClipboard } from 'usehooks-ts'
import { CopyIcon } from '@/assets'
import QRCode from 'react-qr-code'

type ModalKeyNotFoundContentProps = {
  onClose: () => void
}

export const ModalKeyNotFoundContent: FC<ModalKeyNotFoundContentProps> = () => {
  const notify = useEnqueueSnackbar()
  // eslint-disable-next-line
  const [_, copyToClipboard] = useCopyToClipboard()
  const isMobile = useMediaQuery('(max-width:600px)')

  const link = window.location.href
  const shareData = useMemo(
    () => ({
      text: window.location.href,
    }),
    []
  )

  const canShare = useMemo(() => {
    if (!('navigator' in window)) return false
    return !!navigator.share && navigator.canShare(shareData)
  }, [shareData])

  const handleCopy = async (text: string) => {
    try {
      await copyToClipboard(text)
      notify('Link copied to the clipboard!', 'success')
    } catch (error) {
      notify('Failed to copy to the clipboard!', 'error')
    }
  }

  const handleShare = async () => {
    try {
      if (canShare) await navigator.share(shareData)
      else await handleCopy(link)
    } catch (err: any) {
      if (err.toString().includes('AbortError')) return
      notify('Your browser does not support sharing data', 'warning')
    }
  }

  return (
    <Stack gap={'1rem'}>
      <Typography textAlign={'center'}>
        Looks like you signed up on another device. Please open this link on that device or scan this QR code by that
        device.
      </Typography>

      <Box display={'grid'} sx={{ placeItems: 'center' }}>
        <QRCode value={link} size={isMobile ? 150 : 200} />
      </Box>
      <Button onClick={handleShare} endIcon={<ShareIcon />}>
        Send link
      </Button>
      <Button onClick={() => handleCopy(link)} endIcon={<CopyIcon />}>
        Copy link
      </Button>
    </Stack>
  )
}

// FIXME show modal with
// title "Key not found"
// text "Looks like you signed up on another device. Please open this link on that device or scan this QR code by that device."
// button2 "Send link" - navigator.share
// button1 "Copy link"
// link to window.location.href
