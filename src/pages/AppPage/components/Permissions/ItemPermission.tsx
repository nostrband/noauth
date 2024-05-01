import { FC } from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import { DbPerm } from '@/modules/common/db-types'
import { formatTimestampDate } from '@/utils/helpers/date'
import { StyledPermissionItem } from './styled'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import DoneRoundedIcon from '@mui/icons-material/DoneRounded'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import { ItemPermissionMenu } from './ItemPermissionMenu'
import { useOpenMenu } from '@/hooks/useOpenMenu'
import { getPermActionName } from '@/utils/helpers/helpers'

type ItemPermissionProps = {
  permission: DbPerm
}

export const ItemPermission: FC<ItemPermissionProps> = ({ permission }) => {
  const { value, timestamp, id } = permission || {}

  const { anchorEl, handleClose, handleOpen, open } = useOpenMenu()

  const isAllowed = value === '1'

  return (
    <>
      <StyledPermissionItem>
        <Box display={'flex'} flexDirection={'column'} gap={'0.5rem'} flex={1}>
          <Typography flex={1} fontWeight={700}>
            {getPermActionName(permission)}
          </Typography>
          <Typography variant="body2">{formatTimestampDate(timestamp)}</Typography>
        </Box>
        <Box>{isAllowed ? <DoneRoundedIcon htmlColor="green" /> : <ClearRoundedIcon htmlColor="red" />}</Box>
        <IconButton onClick={handleOpen}>
          <MoreVertRoundedIcon />
        </IconButton>
      </StyledPermissionItem>
      <ItemPermissionMenu anchorEl={anchorEl} open={open} handleClose={handleClose} permId={id} />
    </>
  )
}
