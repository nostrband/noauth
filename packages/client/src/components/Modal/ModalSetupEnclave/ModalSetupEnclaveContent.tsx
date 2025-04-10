import { FC, Fragment, useCallback, useEffect, useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
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
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'

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

  const [info, setInfo] = useState<any | undefined>()
  const [enclaves, setEnclaves] = useState<IEnclave[]>([])
  const [selectedEnclave, setSelectedEnclave] = useState<IEnclave | null>(null)
  const [status, setStatus] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  const { open, handleClose, handleShow } = useToggleConfirm()

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      const es = await client.listEnclaves()
      const enclaves = es.map((e) => parseEnclave(e)).filter(notEmpty)
      setEnclaves(enclaves)
      const info = await client.getKeyEnclaveInfo(npub)
      setInfo(info)
      setIsLoading(false)
    } catch (error) {
      console.log(error)
      setIsLoading(false)
    }
  }, [npub])

  useEffect(() => {
    load()
  }, [load])

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
      for (const e of info.enclaves) {
        await client.deleteKeyFromEnclave(npub, e.pubkey)
      }
      notify('Successfully deleted!', 'success')
      // let user notice changes
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
  const currentEnclave = hasEnclaves ? enclaves?.find((e) => e.event.pubkey === info?.enclaves[0].pubkey) : undefined

  const handleSelectEnclave = (id: string) => {
    const enclave = enclaves.find((e) => e.event.id === id)
    if (enclave) setSelectedEnclave(enclave)
  }

  if (isLoading) {
    return (
      <Box minHeight={'10rem'} display={'grid'} sx={{ placeItems: 'center' }}>
        <LoadingSpinner mode="secondary" size={'2rem'} />
      </Box>
    )
  }

  return (
    <>
      <Stack gap={'0.75rem'}>
        <Typography textAlign={'center'}>EXPERIMENTAL FEATURE! DO NOT USE WITH REAL KEYS!</Typography>

        <Typography>
          To enable secure reliable always-online signing, you can upload your key to a signer running inside{' '}
          <a href="https://aws.amazon.com/ec2/nitro/nitro-enclaves/" target="_blank" rel="noreferrer">
            AWS Nitro Enclave
          </a>
          . Enclave operators cannot access the code or data inside the enclave. Learn more{' '}
          <a href="https://github.com/nostrband/noauth-enclaved/" target="_blank" rel="noreferrer">
            here
          </a>
          .
        </Typography>

        {currentEnclave && (
          <Fragment>
            <Typography>
              <span>Uploaded to enclave:</span>
              <EnclaveCard fullWidth withBorder {...currentEnclave} />
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

            {selectedEnclave && <EnclaveCard fullWidth withBorder {...selectedEnclave} />}

            <Typography>
              Enclaves run a specific version of reproducible code in an isolated environment, and provide cryptographic
              attestation signed by AWS. Nsec.app verified the attestation of the enclaves listed above. The code of
              enclaves listed above was reviewed and considered safe.
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
          headingText="Upload key to enclave"
          description={getConfirmDescription(getEnvironmentStatus(selectedEnclave.prod, selectedEnclave.debug))}
          onCancel={handleClose}
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      )}
    </>
  )
}
