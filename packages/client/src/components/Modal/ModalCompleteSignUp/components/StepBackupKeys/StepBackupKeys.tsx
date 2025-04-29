import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { Button } from '@/shared/Button/Button'
import { Input } from '@/shared/Input/Input'
import { Stack, Typography } from '@mui/material'
import { FC, useState } from 'react'
import { useCopyToClipboard } from 'usehooks-ts'
import { MODAL_STEPS, ModalStep } from '../../utils'
import { useLocation } from 'react-router-dom'

type StepBackupKeysProps = {
  npub: string
  onChangeStep: (newStep: ModalStep) => void
}

const IMPORT_HASH_KEY = '#import'

export const StepBackupKeys: FC<StepBackupKeysProps> = ({ npub, onChangeStep }) => {
  const { hash } = useLocation()
  const hashParams = new URLSearchParams(hash)
  const nsec = hashParams.get(IMPORT_HASH_KEY) || ''

  const notify = useEnqueueSnackbar()

  // eslint-disable-next-line
  const [_, copyToClipboard] = useCopyToClipboard()
  const [isKeySaved, setIsKeySaved] = useState(false)

  if (!nsec) return null

  const handleCopy = async () => {
    try {
      await copyToClipboard(nsec)
      notify('Nsec copied to the clipboard!', 'success')
      setIsKeySaved(true)
    } catch (error) {
      notify('Failed to copy to the clipboard!', 'error')
    }
  }

  const handleNextStep = () => {
    onChangeStep(MODAL_STEPS[2])
  }

  return (
    <Stack gap={'1rem'} width={'100%'}>
      <Typography textAlign={'center'}>Please back up your key</Typography>

      <Input readOnly value={nsec} fullWidth />

      <Button onClick={handleCopy}>Copy key to clipboard</Button>

      <Button onClick={handleNextStep} disabled={!isKeySaved}>
        I saved my key
      </Button>
    </Stack>
  )
}
