import React, { useEffect, useState } from 'react'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Button } from '@/shared/Button/Button'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Fade, Stack } from '@mui/material'
import { AppLink } from '@/shared/AppLink/AppLink'

export const ModalInitial = () => {
	const { getModalOpened, createHandleCloseReplace, handleOpen } = useModalSearchParams()
	const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.INITIAL)

	const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.INITIAL)

	const [showAdvancedContent, setShowAdvancedContent] = useState(false)

	const handleShowAdvanced = () => {
		setShowAdvancedContent(true)
	}

	useEffect(() => {
		return () => {
			if (isModalOpened) {
				setShowAdvancedContent(false)
			}
		}
	}, [isModalOpened])

	return (
		<Modal open={isModalOpened} onClose={handleCloseModal}>
			<Stack paddingTop={'0.5rem'} gap={'1rem'}>
				<Button onClick={() => handleOpen(MODAL_PARAMS_KEYS.SIGN_UP)}>
					Sign up
				</Button>
				<Button onClick={() => handleOpen(MODAL_PARAMS_KEYS.LOGIN)}>
					Login
				</Button>
				<AppLink
					title='Advanced'
					alignSelf={'center'}
					onClick={handleShowAdvanced}
				/>

				{showAdvancedContent && (
					<Fade in>
						<Button
							onClick={() =>
								handleOpen(MODAL_PARAMS_KEYS.IMPORT_KEYS)
							}
						>
							Import keys
						</Button>
					</Fade>
				)}
			</Stack>
		</Modal>
	)
}
