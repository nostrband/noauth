import { DbPerm } from '@/modules/db'
import { Menu, MenuItem, MenuProps } from '@mui/material'
import { FC } from 'react'
import { ItemPermissionMenu } from './ItemPermissionMenu'

type PermissionsMenuProps = {
	perms: DbPerm[]
} & MenuProps

export const PermissionsMenu: FC<PermissionsMenuProps> = ({
	perms,
	open,
	anchorEl,
	onClose,
}) => {
	const isNoPerms = perms.length === 0
	return (
		<Menu open={open} anchorEl={anchorEl} onClose={onClose}>
			{isNoPerms && <MenuItem>No permissions</MenuItem>}
			{!isNoPerms &&
				perms.map((perm) => (
					<ItemPermissionMenu permission={perm} key={perm.id} />
				))}
		</Menu>
	)
}
