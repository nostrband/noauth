import { FC } from 'react'
import { Button } from '@/shared/Button/Button'
import { Stack, Typography } from '@mui/material'
import { selectAppByAppNpub } from '@/store'
import { useAppSelector } from '@/store/hooks/redux'

type StepFinishSignUpProps = {
  appNpub: string
  onClose: () => void
}

export const StepFinishSignUp: FC<StepFinishSignUpProps> = ({ onClose, appNpub }) => {
  const currentApp = useAppSelector((state) => selectAppByAppNpub(state, appNpub))

  const handleContinue = () => {
    if (currentApp) window.location.href = new URL(currentApp.url).origin + '/#signup-complete=true'
    else onClose()
  }

  const app = currentApp ? new URL(currentApp.url).hostname : ''

  return (
    <Stack gap={'1rem'}>
      <Typography>
        Your Nostr keys are now stored safely in Nsec.app
        {app && (
          <>
            &nbsp;and connected to <b>{app}</b>
          </>
        )}
        .
      </Typography>
      <Button fullWidth onClick={handleContinue}>
        Continue
      </Button>
    </Stack>
  )
}
