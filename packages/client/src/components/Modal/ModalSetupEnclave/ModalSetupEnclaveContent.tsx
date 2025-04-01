import React, { FC, useEffect, useState } from 'react'
import { Stack, Typography } from '@mui/material'
import { Button } from '@/shared/Button/Button'
import { useParams } from 'react-router-dom'
import { client } from '@/modules/client'
import { Event, nip19 } from 'nostr-tools'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { hexToBytes } from "@noble/hashes/utils"

type ModalSetupEnclaveContentProps = {
  onClose: () => void
}

function parseEnclave(e: Event) {
  try {
    return {
      event: e,
      prod: !!e.tags.find(t => t.length > 1 && t[0] === "t" && t[1] === "prod"),
      debug: !hexToBytes(e.tags.find(t => t.length > 2 && t[0] === "x" && t[2] === "PCR0")![1]).find(c => c !== 0),
      builder: e.tags.find(t => t.length > 2 && t[0] === 'p' && t[2] === 'builder')?.[1] || "",
      launcher: e.tags.find(t => t.length > 2 && t[0] === 'p' && t[2] === 'builder')?.[1] || "",
      version: e.tags.find(t => t.length > 1 && t[0] === "v")?.[1] || "",
    }
  } catch (err) {
    console.log("bad enclave", e, err);
  }
}

export const ModalSetupEnclaveContent: FC<ModalSetupEnclaveContentProps> = ({ onClose }) => {
  const { npub = '' } = useParams<{ npub: string }>()
  const [status, setStatus] = useState<string>('')
  const [info, setInfo] = useState<any | undefined>()
  const [enclaves, setEnclaves] = useState<any[]>([])
  const notify = useEnqueueSnackbar()

  useEffect(() => {
    client.listEnclaves().then((es) => setEnclaves(es.map(e => parseEnclave(e))))
  }, [])

  useEffect(() => {
    client.getKeyEnclaveInfo(npub).then((i) => setInfo(i))
  }, [npub])

  const handleUpload = async () => {
    try {
      if (!enclaves.length) throw new Error('No active enclaves')

      setStatus('Loading...')
      await client.uploadKeyToEnclave(npub, enclaves[0].event.pubkey)
      notify('Successfully uploaded!', 'success')
      await new Promise((ok) => setTimeout(ok, 1000))
      onClose()
    } catch (error) {
      setStatus('Upload Error: ' + error)
      notify('Upload error', 'error')
    }
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

  // console.log("enclaves", enclaves);
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
      {info?.enclaves?.length > 0 && (
        <>
          <Typography>
            Uploaded to enclave{' '}
            <a
              href={
                'https://njump.me/' +
                nip19.neventEncode({ id: info.enclaves[0].id, relays: ['wss://relay.nostr.band/all'] })
              }
              target="_blank"
              rel="noreferrer"
            >
              {info.enclaves[0].pubkey.substring(0, 10)}...
            </a>
          </Typography>
          <Button onClick={handleDelete} disabled={status !== ''}>
            Delete from enclave
          </Button>
        </>
      )}
      {!info?.enclaves?.length && (
        <Button onClick={handleUpload} disabled={status !== ''}>
          Upload key
        </Button>
      )}

      {status && (
        <Typography fontWeight={500} textAlign={'center'} variant="body1" color={'GrayText'}>
          {status}
        </Typography>
      )}
    </Stack>
  )
}
