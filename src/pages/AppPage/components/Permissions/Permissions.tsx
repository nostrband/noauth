import { FC } from 'react'
import { DbPerm } from '@/modules/db'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { Box } from '@mui/material'
import { ItemPermission } from './ItemPermission'

type PermissionsProps = {
  perms: DbPerm[]
}

export const Permissions: FC<PermissionsProps> = ({ perms }) => {
  return (
    <Box width={'100%'} marginBottom={'1rem'} flex={1} overflow={'auto'}>
      <SectionTitle marginBottom={'0.5rem'}>Permissions</SectionTitle>
      <Box flex={1} overflow={'auto'} display={'flex'} flexDirection={'column'} gap={'0.5rem'}>
        {perms.map((perm) => {
          return <ItemPermission key={perm.id} permission={perm} />
        })}
      </Box>
    </Box>
  )
}
