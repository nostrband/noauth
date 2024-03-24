import { FC } from 'react'
import { DbPerm } from '@/modules/db'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { Box, Stack, useMediaQuery } from '@mui/material'
import { ItemPermission } from './ItemPermission'

type PermissionsProps = {
  perms: DbPerm[]
}

export const Permissions: FC<PermissionsProps> = ({ perms }) => {
  const isMobile = useMediaQuery('(max-width:600px)')

  return (
    <>
      <SectionTitle marginBottom={'0.5rem'}>Permissions</SectionTitle>

      <Box width={'100%'} marginBottom={'1rem'} flex={1} overflow={isMobile ? 'initial' : 'auto'}>
        <Stack gap={'0.5rem'}>
          {perms.map((perm) => {
            return <ItemPermission key={perm.id} permission={perm} />
          })}
        </Stack>
      </Box>
    </>
  )
}
