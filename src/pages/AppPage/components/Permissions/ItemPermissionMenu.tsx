import { FC, useState } from 'react'
import { Menu, MenuItem, MenuProps } from '@mui/material'
import { ConfirmModal } from '@/shared/ConfirmModal/ConfirmModal'
import { swicCall } from '@/modules/swic'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'

type ItemPermissionMenuProps = {
	permId: string
	handleClose: () => void
} & MenuProps

export const ItemPermissionMenu: FC<ItemPermissionMenuProps> = ({
	open,
	anchorEl,
	handleClose,
	permId,
}) => {
	const [showConfirm, setShowConfirm] = useState(false)
	const notify = useEnqueueSnackbar()

	const handleShowConfirm = () => {
		setShowConfirm(true)
		handleClose()
	}
	const handleCloseConfirm = () => setShowConfirm(false)

	const handleDeletePerm = async () => {
		try {
			await swicCall('deletePerm', permId)
			notify('Permission successfully deleted!', 'success')
			handleCloseConfirm()
		} catch (error: any) {
			notify(error?.message || 'Failed to delete permission', 'error')
		}
	}

	return (
		<>
			<Menu
				open={open}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{
					horizontal: 'left',
					vertical: 'bottom',
				}}
			>
				<MenuItem onClick={handleShowConfirm}>
					Delete permission
				</MenuItem>
			</Menu>
			<ConfirmModal
				open={showConfirm}
				onClose={handleCloseConfirm}
				onCancel={handleCloseConfirm}
				headingText='Delete permission'
				description='Are you sure you want to delete this permission?'
				onConfirm={handleDeletePerm}
			/>
		</>
	)
}
