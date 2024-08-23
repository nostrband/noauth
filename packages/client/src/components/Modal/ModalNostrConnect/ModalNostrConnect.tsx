import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Modal } from '@/shared/Modal/Modal'
import { Box, Stack, Typography } from '@mui/material'
import { IconApp } from '@/shared/IconApp/IconApp'
import { useAppSelector } from '@/store/hooks/redux'
import { selectKeys } from '@/store'
import { parseMetadata } from './utils/helpers'
import { Keys } from './components/Keys'
import { getDomainPort } from '@/utils/helpers/helpers'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { client } from '@/modules/client'
import { useState } from 'react'

export const ModalNostrConnect = () => {
  const navigate = useNavigate()
  const notify = useEnqueueSnackbar()
  const [searchParams] = useSearchParams()
  const { pubkey = '' } = useParams()
  console.log({ pubkey })

  const [isLoading, setIsLoading] = useState(false)

  const keys = useAppSelector(selectKeys)

  const metadataJson = searchParams.get('metadata') || ''
  const metadata = parseMetadata(metadataJson) || {
    url: searchParams.get('url'),
    name: searchParams.get('name'),
    icon: searchParams.get('image'),
  }

  const { icon, name, url } = metadata || {}
  const appName = name || ''
  const appUrl = url || ''
  const appDomain = getDomainPort(appUrl)
  const appIcon = icon || ''

  if (!pubkey || !metadata) {
    return <Navigate to={'/'} />
  }

  const connect = async (npub: string) => {
    setIsLoading(true)
    try {
      const nostrconnect = `nostrconnect://${pubkey}?${searchParams.toString()}`
      const requestId = await client.nostrConnect(npub, nostrconnect)
      setIsLoading(false)

      console.log('requestId', requestId)
      if (!requestId) return notify('Connected!', 'success')
      return navigate(`/key/${npub}?confirm-connect=true&reqId=${requestId}`)
    } catch (e) {
      notify('Error: ' + e, 'error')
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    navigate('/home')
  }

  return (
    <Modal title="Connect to app" open onClose={handleClose}>
      <Stack direction={'row'} gap={'1rem'} alignItems={'center'} marginBottom={'1.5rem'}>
        <IconApp picture={appIcon} alt={appName} size="large" domain={appUrl} />
        <Box overflow={'auto'}>
          <Typography variant="h5" fontWeight={600} noWrap>
            {appDomain || appName}
          </Typography>
          <Typography variant="body2" color={'GrayText'} noWrap>
            New app would like to connect
          </Typography>
        </Box>
      </Stack>

      <Stack gap={'1rem'}>
        <Typography variant="subtitle1">Choose account to connect to this app:</Typography>
        <Keys keys={keys} onKeyClick={connect} isLoading={isLoading} />
        <Typography variant="subtitle2" color={'GrayText'} fontSize={'12px'}>
          Please check that app provided the correct name, address and icon to avoid confusion.
        </Typography>
      </Stack>
    </Modal>
  )
}
