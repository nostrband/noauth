import { FC, useEffect, useState } from 'react'
import { IEnclave } from '../../types'
import { Chip, Divider, Link, Stack, Typography } from '@mui/material'

import { EnclaveProfile } from '../EnclaveProfile/EnclaveProfile'
import { getEnvironmentStatus, tv } from '../../helpers'
import { nip19 } from 'nostr-tools'
import { PrivateKeySigner, EnclaveClient } from '@noauth/backend'

type EnclaveCardProps = IEnclave & {
  withBorder?: boolean
  fullWidth?: boolean
  noLinkToExplorer?: boolean
  noPing?: boolean
}

export const EnclaveCard: FC<EnclaveCardProps> = ({
  event,
  builder,
  launcher,
  debug,
  prod,
  version,
  withBorder = false,
  fullWidth = false,
  noLinkToExplorer = false,
  noPing = false,
}) => {
  // console.log('enclave card', event)
  const [ping, setPing] = useState(0)

  const name = tv(event, 'name') || ''
  const env = getEnvironmentStatus(prod, debug)

  useEffect(() => {
    if (noPing) {
      setPing(0)
      return
    }

    const client = new EnclaveClient(
      event.pubkey,
      [tv(event, 'relay') || 'wss://relay.nsec.app'],
      PrivateKeySigner.generate()
    )
    client
      .ping()
      .then((p) => setPing(p))
      .catch(() => setPing(-1))
  }, [event, noPing])

  return (
    <Stack
      width={fullWidth ? '100%' : undefined}
      gap={'0.75rem'}
      border={withBorder ? '1px solid gray' : ''}
      p={'0.75rem'}
      borderRadius={'8px'}
    >
      <Stack direction={'row'} alignItems={'center'} gap={'0.5rem'} flexWrap={'wrap'} justifyContent={'space-between'}>
        {!noLinkToExplorer ? (
          <Link
            target="_blank"
            rel="noreferrer"
            href={`https://enclaved.org/instance/${nip19.npubEncode(event.pubkey)}`}
          >
            <Typography fontSize={18} fontWeight={500}>
              {name}
            </Typography>
          </Link>
        ) : (
          <Typography fontSize={18} fontWeight={500}>
            {name}
          </Typography>
        )}
        <Stack direction={'row'} alignItems={'center'} gap={'0.5rem'}>
          <Chip variant="outlined" size="small" label={`v.${version}`} />
          <Chip variant="outlined" color={debug ? 'error' : prod ? 'success' : 'warning'} size="small" label={env} />
          {ping !== 0 && (
            <Chip
              variant="outlined"
              color={ping < 0 ? 'error' : ping < 300 ? 'success' : 'warning'}
              size="small"
              label={`Ping ${ping} ms`}
            />
          )}
        </Stack>
      </Stack>

      <Stack gap={'0.5rem 0.75rem'} direction={'row'}>
        <Stack direction={'row'} gap={'0.5rem'} alignItems={'center'}>
          <Typography variant="body2">Build by:</Typography>
          <EnclaveProfile pubkey={builder} />
        </Stack>

        <Divider orientation="vertical" sx={{ height: 'inherit', width: 2 }} />

        <Stack direction={'row'} gap={'0.5rem'} alignItems={'center'}>
          <Typography variant="body2">Launched by:</Typography>
          <EnclaveProfile pubkey={launcher} />
        </Stack>
      </Stack>
    </Stack>
  )
}
