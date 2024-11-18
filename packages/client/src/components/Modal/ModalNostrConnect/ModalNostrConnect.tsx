import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Modal } from '@/shared/Modal/Modal'
import { Box, Stack, Typography } from '@mui/material'
import { IconApp } from '@/shared/IconApp/IconApp'
import { useAppSelector } from '@/store/hooks/redux'
import { selectKeys } from '@/store'
import { parseNostrConnectMeta } from './utils/helpers'
import { Keys } from './components/Keys'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { client } from '@/modules/client'
import { useState } from 'react'
import useIframePort from '@/hooks/useIframePort'

export const ModalNostrConnect = () => {
  const navigate = useNavigate()
  const notify = useEnqueueSnackbar()
  const [searchParams] = useSearchParams()
  const { pubkey = '' } = useParams()
  console.log({ pubkey })

  const [isLoading, setIsLoading] = useState(false)

  const keys = useAppSelector(selectKeys)

  const meta = parseNostrConnectMeta('?' + searchParams.toString());

  // default
  const isPopup = true

  // let this modal accept the iframe port to pass it
  // down to ConfirmConnect modal later on
  useIframePort(isPopup);

  if (!pubkey || !meta || !keys.length) {
    return <Navigate to={'/'} />
  }

  const closePopup = () => {
    if (isPopup) return window.close()
  }

  const connect = async (npub: string) => {
    setIsLoading(true)
    try {
      const nostrconnect = `nostrconnect://${pubkey}?${searchParams.toString()}`
      console.log('nostrconnect', nostrconnect)
      const requestId = await client.nostrConnect(npub, nostrconnect, {
        appName: meta.appName,
        appUrl: meta.appUrl,
        appIcon: meta.appIcon,
        perms: meta.perms,
      })
      setIsLoading(false)

      console.log('requestId', requestId)
      if (!requestId) {
        notify('App connected! Closing...', 'success')
        if (isPopup) setTimeout(() => closePopup(), 3000)
        else navigate(`/key/${npub}`, { replace: true })
      } else {
        return navigate(`/key/${npub}?confirm-connect=true&reqId=${requestId}&popup=true`)
      }
    } catch (e) {
      notify('Error: ' + e, 'error')
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    navigate('/home')
  }

  return (
    <Modal title="Choose account" open onClose={handleClose}>
      <Stack direction={'row'} gap={'1rem'} alignItems={'center'} marginBottom={'1.5rem'}>
        <IconApp picture={meta.appIcon} alt={meta.appName} size="large" domain={meta.appUrl} />
        <Box overflow={'auto'}>
          <Typography variant="h5" fontWeight={600} noWrap>
            {meta.appDomain || meta.appName}
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
