import { useCallback, useState } from 'react'

export const useToggleConfirm = () => {
	const [showConfirm, setShowConfirm] = useState(false)

	const handleShow = useCallback(() => setShowConfirm(true), [])

	const handleClose = useCallback(() => setShowConfirm(false), [])

	return {
		open: showConfirm,
		handleShow,
		handleClose,
	}
}
