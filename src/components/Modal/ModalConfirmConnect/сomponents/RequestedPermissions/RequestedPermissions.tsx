import React, { FC } from 'react'
import { DbPerm } from '@/modules/db'
import { List } from '@mui/material'
import { ItemRequestedPermission } from './ItemRequestedPermission'

export type RequestedPerm = DbPerm & { checked: boolean }

type RequestedPermissionsProps = {
  requestedPerms: RequestedPerm[]
  onChangeCheckbox: (reqId: string) => void
}

export const RequestedPermissions: FC<RequestedPermissionsProps> = ({ requestedPerms, onChangeCheckbox }) => {
  return (
    <List>
      {requestedPerms.map((req) => {
        return (
          <ItemRequestedPermission
            key={req.id}
            requestedPerm={req}
            onChange={() => {
              onChangeCheckbox(req.id)
            }}
          />
        )
      })}
    </List>
  )
}
