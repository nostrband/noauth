import { Navigate, useParams, useSearchParams } from 'react-router-dom'
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

export const ModalNostrConnect = () => {
  const notify = useEnqueueSnackbar()
  const [searchParams] = useSearchParams()
  const { pubkey = '' } = useParams()
  console.log({ pubkey })

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
    try {
      const nostrconnect = `nostrconnect://${pubkey}?${searchParams.toString()}`
      const requestId = await client.nostrConnect(npub, nostrconnect)
      console.log('requestId', requestId)
      if (requestId) {

      } else {
        
      }
    } catch (e) {
      console.log(`Error: ${e}`)
      notify('Error: ' + e, 'error')
    }
  }

  return (
    <Modal title="Connect to app" open withCloseButton={false}>
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
        <Keys keys={keys} />
        <Typography variant="body1" color={'GrayText'}>
          Please check that app provided the correct name, address and icon to avoid confusion.
        </Typography>
      </Stack>
    </Modal>
  )
}
