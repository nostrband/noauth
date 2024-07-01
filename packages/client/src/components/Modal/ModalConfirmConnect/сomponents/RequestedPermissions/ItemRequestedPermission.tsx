import { FC } from 'react'
import { Checkbox } from '@/shared/Checkbox/Checkbox'
import { getPermActionName } from '@/utils/helpers/helpers'
import { ListItemText } from '@mui/material'
import { RequestedPerm } from './RequestedPermissions'
import { StyledFormControlLabel, StyledListItem } from './styled'

type ItemRequestedPermissionProps = {
  requestedPerm: RequestedPerm
  onChange: () => void
}

export const ItemRequestedPermission: FC<ItemRequestedPermissionProps> = ({ requestedPerm, onChange }) => {
  return (
    <StyledListItem key={requestedPerm.id}>
      <ListItemText>
        <StyledFormControlLabel
          label={getPermActionName(requestedPerm)}
          control={<Checkbox id={requestedPerm.id} checked={requestedPerm.checked} onChange={onChange} />}
        />
      </ListItemText>
    </StyledListItem>
  )
}
