import React, { FC, useState } from 'react'
import { Stack, Typography } from '@mui/material'
import { Button } from '@/shared/Button/Button'

type ModalSetupEnclaveContentProps = {
  onClose: () => void
}

export const ModalSetupEnclaveContent: FC<ModalSetupEnclaveContentProps> = ({ onClose }) => {
  const [uploadStatus, setUploadStatus] = useState<string>('Loading')

  const handleUpload = async () => {
    try {
      setUploadStatus('Loading...')
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setUploadStatus('Successfully uploaded!')
      onClose()
    } catch (error) {
      setUploadStatus('Upload Error.')
    }
  }

  return (
    <Stack gap={'0.75rem'}>
      <Typography>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Enim, temporibus? Sunt, deserunt fugiat? Est,
        necessitatibus minus quisquam fuga, doloribus consequuntur, velit reprehenderit voluptate similique a ratione
        dolorum odit. Quisquam, adipisci.
      </Typography>
      <Button onClick={handleUpload}>Upload</Button>

      {uploadStatus && (
        <Typography fontWeight={500} textAlign={'center'} variant="body1" color={'GrayText'}>
          {uploadStatus}
        </Typography>
      )}
    </Stack>
  )
}
