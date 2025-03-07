import React, { FC } from 'react'
import useIframePort from '@/hooks/useIframePort'
import { Button } from '@/shared/Button/Button'
import { getReferrerAppUrl } from '@/utils/helpers/helpers'
import { Stack, Typography } from '@mui/material'

type StepFinishSignUpProps = {
  onClose: () => void
}

export const StepFinishSignUp: FC<StepFinishSignUpProps> = ({ onClose }) => {
  const { referrer } = useIframePort(true)

  const appUrl = referrer || getReferrerAppUrl()

  const handleContinue = () => {
    onClose()
  }

  return (
    <Stack gap={'1rem'}>
      <Typography>
        Your keys are now stored in nsec.app, you can continue to use {appUrl} that now has access to your keys
      </Typography>
      <Button fullWidth onClick={handleContinue}>
        Continue
      </Button>
    </Stack>
  )
}
