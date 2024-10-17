import { FC, useState } from 'react'
import { QrFrameIcon } from '@/assets'
import { Box, Stack } from '@mui/material'
import { Button } from '@/shared/Button/Button'
import { useQrReader } from '../hooks/useQrReader'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { QrBoxContainer } from './styled'

type ModalQrScannerContentProps = {
  onCancel: () => void
  onScanSuccess: (data: string) => void
}

export const ModalQrScannerContent: FC<ModalQrScannerContentProps> = ({ onCancel, onScanSuccess }) => {
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const [qrBoxEl, setQrBoxEl] = useState<HTMLDivElement | null>(null)

  const { isLoading } = useQrReader({
    qrBoxElement: qrBoxEl,
    videoElement: videoEl,
    onClose: onCancel,
    onScanSuccess: onScanSuccess,
  })

  return (
    <Stack gap={'0.5rem'}>
      <QrBoxContainer>
        {isLoading && (
          <Box display={'grid'} sx={{ placeItems: 'center' }} height={'100%'} width={'100%'}>
            <LoadingSpinner mode="secondary" size={25} />
          </Box>
        )}
        <video ref={(node) => setVideoEl(node)}></video>
        <div ref={(node) => setQrBoxEl(node)} className="qr-box">
          <img src={QrFrameIcon} alt="Qr Frame" width={256} height={256} className="qr-frame" />
        </div>
      </QrBoxContainer>
      <Button onClick={onCancel}>Cancel</Button>
    </Stack>
  )
}
