import React from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'

import { Modal } from '@/shared/Modal/Modal'
import { Box, Stack, Typography } from '@mui/material'
import { IconApp } from '@/shared/IconApp/IconApp'
import { useAppSelector } from '@/store/hooks/redux'
import { selectKeys } from '@/store'
import { parseMetadata } from './utils/helpers'
import { Keys } from './components/Keys'

export const ModalNostrConnect = () => {
  const [searchParams] = useSearchParams()
  const { pubkey = '' } = useParams()
  console.log({ pubkey })

  const keys = useAppSelector(selectKeys)

  const metadataJson = searchParams.get('metadata') || ''
  const metadata = parseMetadata(metadataJson)

  const { icon, name, url } = metadata || {}
  const appName = name || ''
  const appUrl = url || ''
  const appIcon = icon || ''

  if (!metadataJson || !pubkey || !metadata) {
    return <Navigate to={'/'} />
  }

  return (
    <Modal title="Connect" open withCloseButton={false}>
      <Stack direction={'row'} gap={'1rem'} alignItems={'center'} marginBottom={'1rem'}>
        <IconApp picture={appIcon} alt={appName} size="large" domain={appUrl} />
        <Box overflow={'auto'}>
          <Typography variant="h5" fontWeight={600} noWrap>
            {appName}
          </Typography>
          <Typography variant="body2" color={'GrayText'} noWrap>
            New app would like to connect
          </Typography>
        </Box>
      </Stack>

      <Stack>
        <Typography textAlign={'center'} p={'0.5rem'} variant="subtitle1">
          Choose account to connect to this app:
        </Typography>
        <Keys keys={keys} />
      </Stack>
    </Modal>
  )
}
