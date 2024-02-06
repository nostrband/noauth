import React, { FC } from 'react'
import { Warning } from '@/components/Warning/Warning'
import { CircularProgress, Stack } from '@mui/material'
import GppMaybeIcon from '@mui/icons-material/GppMaybe'

type BackgroundSigningWarningProps = {
  isEnabling: boolean
  onEnableBackSigning: () => void
}

export const BackgroundSigningWarning: FC<BackgroundSigningWarningProps> = ({ isEnabling, onEnableBackSigning }) => {
  return (
    <Warning
      message={
        <Stack direction={'row'} alignItems={'center'} gap={'1rem'}>
          Please enable push notifications {isEnabling ? <CircularProgress size={'1.5rem'} /> : null}
        </Stack>
      }
      Icon={<GppMaybeIcon htmlColor="white" />}
      onClick={isEnabling ? undefined : onEnableBackSigning}
    />
  )
}
