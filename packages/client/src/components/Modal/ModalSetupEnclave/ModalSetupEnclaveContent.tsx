import React, { FC, useState } from 'react'
import { Stack, Typography } from '@mui/material'
import { Button } from '@/shared/Button/Button'
import { useParams } from 'react-router-dom'
import { client } from '@/modules/client'

type ModalSetupEnclaveContentProps = {
  onClose: () => void
}

export const ModalSetupEnclaveContent: FC<ModalSetupEnclaveContentProps> = ({ onClose }) => {
  const { npub = '' } = useParams<{ npub: string }>()
  const [uploadStatus, setUploadStatus] = useState<string>('')

  const handleUpload = async () => {
    try {
      setUploadStatus('Loading...')
      await client.uploadKeyToEnclave(npub)
      setUploadStatus('Successfully uploaded!')
      // onClose()
    } catch (error) {
      setUploadStatus('Upload Error: ' + error)
    }
  }

  return (
    <Stack gap={'0.75rem'}>
      <Typography>EXPERIMENTAL FEATURE! DO NOT USE WITH REAL KEYS!</Typography>
      <Typography>
        To enable secure always-online reliable signing, you can upload your key to our signer running on AWS Nitro
        Enclave. Learn more{' '}
        <a href="https://github.com/nostrband/noauth-enclaved/" target="_blank" rel="noreferrer">
          here
        </a>
        .
      </Typography>
      <Button onClick={handleUpload} disabled={uploadStatus !== ''}>
        Upload key
      </Button>

      {uploadStatus && (
        <Typography fontWeight={500} textAlign={'center'} variant="body1" color={'GrayText'}>
          {uploadStatus}
        </Typography>
      )}
    </Stack>
  )
}
