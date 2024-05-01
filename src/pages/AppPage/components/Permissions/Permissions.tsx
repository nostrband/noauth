import { FC } from 'react'
import { DbPerm } from '@/modules/common/db-types'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { Box, Stack, Typography } from '@mui/material'
import { ItemPermission } from './ItemPermission'

type PermissionsProps = {
  perms: DbPerm[]
}

export const Permissions: FC<PermissionsProps> = ({ perms }) => {
  const isEmpty = perms.length === 0

  return (
    <>
      <SectionTitle marginBottom={'0.5rem'}>Permissions</SectionTitle>

      <Box width={'100%'} marginBottom={'1rem'} flex={1}>
        <Stack gap={'0.5rem'}>
          {!isEmpty &&
            perms.map((perm) => {
              return <ItemPermission key={perm.id} permission={perm} />
            })}
          {isEmpty && <Typography textAlign={'center'}>No permissions</Typography>}
        </Stack>
      </Box>
    </>
  )
}
