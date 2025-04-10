import { FC } from 'react'
import { IEnclave } from '../../types'
import { Chip, Divider, Stack, Typography } from '@mui/material'

import { EnclaveProfile } from '../EnclaveProfile/EnclaveProfile'
import { getEnvironmentStatus, tv } from '../../helpers'

type EnclaveCardProps = IEnclave & {
  withBorder?: boolean
  fullWidth?: boolean
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
}) => {
  console.log('enclave card', event)
  const name = tv(event, 'name') || ''
  const env = getEnvironmentStatus(prod, debug)

  return (
    <Stack
      width={fullWidth ? '100%' : undefined}
      gap={'0.75rem'}
      border={withBorder ? '1px solid gray' : ''}
      p={'0.75rem'}
      borderRadius={'8px'}
    >
      <Stack direction={'row'} alignItems={'center'} gap={'0.5rem'} flexWrap={'wrap'} justifyContent={'space-between'}>
        <Typography fontSize={18} fontWeight={500}>
          {name}
        </Typography>
        <Stack direction={'row'} alignItems={'center'} gap={'0.5rem'}>
          <Chip variant="outlined" size="small" label={`v.${version}`} />
          <Chip variant="outlined" size="small" label={env} />
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
