import { FC, Fragment, useEffect, useState } from 'react'
import { Stack, Typography } from '@mui/material'
import { Button } from '@/shared/Button/Button'
import { useParams } from 'react-router-dom'
import { client } from '@/modules/client'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { EnclaveEnvironment, getEnvironmentStatus, notEmpty, parseEnclave } from './helpers'
import { IEnclave } from './types'
import { SelectEnclaves } from './components/SelectEnclaves/SelectEnclaves'
import { EnclaveCard } from './components/EnclaveCard/EnclaveCard'
import { useToggleConfirm } from '@/hooks/useToggleConfirm'
import { ConfirmModal } from '@/shared/ConfirmModal/ConfirmModal'

type ModalSetupEnclaveContentProps = {
  onClose: () => void
}

const getConfirmDescription = (env: EnclaveEnvironment) => {
  if (env === 'dev') return 'This is development instance, are you sure?'
  if (env === 'debug') return 'This is debug instance, your key will not be safe, are you sure?'
  return ''
}

export const ModalSetupEnclaveContent: FC<ModalSetupEnclaveContentProps> = ({ onClose }) => {
  const notify = useEnqueueSnackbar()
  const { npub = '' } = useParams<{ npub: string }>()

  const [status, setStatus] = useState<string>('')
  const [info, setInfo] = useState<any | undefined>()
  const [enclaves, setEnclaves] = useState<IEnclave[]>([])

  const [selectedEnclave, setSelectedEnclave] = useState<IEnclave | null>(null)

  const { open, handleClose, handleShow } = useToggleConfirm()

  useEffect(() => {
    client.listEnclaves().then((es) => {
      const enclaves = es.map((e) => parseEnclave(e)).filter(notEmpty)
      setEnclaves(enclaves)
    })
  }, [])

  useEffect(() => {
    client.getKeyEnclaveInfo(npub).then((i) => setInfo(i))
  }, [npub])

  const handleUploadRequest = async (enclave: IEnclave) => {
    try {
      setStatus('Loading...')
      await client.uploadKeyToEnclave(npub, enclave.event.pubkey)
      notify('Successfully uploaded!', 'success')
      await new Promise((ok) => setTimeout(ok, 1000))
      onClose()
    } catch (error) {
      setStatus('Upload Error: ' + error)
      notify('Upload error', 'error')
    }
  }

  const handleUpload = () => {
    if (!selectedEnclave) throw new Error('No active enclave')
    const env = getEnvironmentStatus(selectedEnclave.prod, selectedEnclave.debug)
    if (env === 'debug' || env === 'dev') return handleShow()
    handleUploadRequest(selectedEnclave)
  }

  const handleConfirm = async () => {
    if (!selectedEnclave) return
    handleUploadRequest(selectedEnclave)
    handleClose()
  }

  const handleDelete = async () => {
    try {
      if (!info.enclaves.length) throw new Error('No active enclave')
      setStatus('Deleting...')
      await client.deleteKeyFromEnclave(npub, enclaves[0].event.pubkey)
      notify('Successfully deleted!', 'success')
      await new Promise((ok) => setTimeout(ok, 1000))
      onClose()
    } catch (error) {
      setStatus('Delete Error: ' + error)
      notify('Delete error', 'error')
    }
  }

  console.log('enclaves', enclaves)
  console.log('info', info)

  const hasEnclaves = info?.enclaves?.length > 0

  const handleSelectEnclave = (id: string) => {
    const enclave = enclaves.find((e) => e.event.id === id)
    if (enclave) setSelectedEnclave(enclave)
  }

  const handleResetSelectedEnclave = () => {
    setSelectedEnclave(null)
  }

  return (
    <>
      <Stack gap={'0.75rem'}>
        <Typography textAlign={'center'}>EXPERIMENTAL FEATURE! DO NOT USE WITH REAL KEYS!</Typography>

        <Typography>
          To enable secure always-online reliable signing, you can upload your key to our signer running on AWS Nitro
          Enclave. Learn more{' '}
          <a href="https://github.com/nostrband/noauth-enclaved/" target="_blank" rel="noreferrer">
            here.
          </a>
        </Typography>

        {hasEnclaves && (
          <Fragment>
            <Typography>
              <span>Uploaded to enclave</span>
              <EnclaveCard fullWidth withBorder {...info.enclaves[0]} />
            </Typography>
            <Button onClick={handleDelete} disabled={status !== ''}>
              Delete from enclave
            </Button>
          </Fragment>
        )}

        {!hasEnclaves && (
          <Fragment>
            {!selectedEnclave && enclaves.length > 0 && (
              <SelectEnclaves enclaves={enclaves} defaultValue={enclaves[0]} onChange={handleSelectEnclave} />
            )}

            {selectedEnclave && (
              <Stack gap={'0.5rem'} alignItems={'center'}>
                <EnclaveCard fullWidth withBorder {...selectedEnclave} />
                <Button varianttype="secondary" onClick={handleResetSelectedEnclave}>
                  Change enclave
                </Button>
              </Stack>
            )}

            <Typography>
              Enclaves provide cryptographic attestation for the exact version of the reproducible server-side code. The
              code of enclaves listed above was reviewed and considered safe.
            </Typography>
            <Button onClick={handleUpload} disabled={status !== ''}>
              Upload key
            </Button>
          </Fragment>
        )}

        {status && (
          <Typography fontWeight={500} textAlign={'center'} variant="body1" color={'GrayText'}>
            {status}
          </Typography>
        )}
      </Stack>

      {selectedEnclave && (
        <ConfirmModal
          open={open}
          headingText="Upload enclave"
          description={getConfirmDescription(getEnvironmentStatus(selectedEnclave.prod, selectedEnclave.debug))}
          onCancel={handleClose}
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      )}
    </>
  )
}
