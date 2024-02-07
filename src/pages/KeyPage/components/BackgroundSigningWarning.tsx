import { FC } from 'react'
import { Warning } from '@/components/Warning/Warning'
import { CircularProgress, Stack, Typography } from '@mui/material'
import AutoModeOutlinedIcon from '@mui/icons-material/AutoModeOutlined'

type BackgroundSigningWarningProps = {
  isEnabling: boolean
  onEnableBackSigning: () => void
}

export const BackgroundSigningWarning: FC<BackgroundSigningWarningProps> = ({ isEnabling, onEnableBackSigning }) => {
  return (
    <Warning
      message={
        <Stack direction={'row'} alignItems={'center'} gap={'1rem'}>
          Enable background service {isEnabling ? <CircularProgress size={'1.5rem'} /> : null}
        </Stack>
      }
      hint={
        <Typography variant='body2'>
          Please allow notifications
          for background operation. 
        </Typography>
      }
      icon={<AutoModeOutlinedIcon htmlColor="white" />}
      onClick={isEnabling ? undefined : onEnableBackSigning}
    />
  )
}
