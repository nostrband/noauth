import React, { FC } from 'react'
import { Box, Stack } from '@mui/material'
import { EXPLANATION_MODAL_KEYS, MODAL_PARAMS_KEYS } from '@/types/modal'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { AppLink } from '@/shared/AppLink/AppLink'
import { InputCopyButton } from '@/shared/InputCopyButton/InputCopyButton'
import { StyledInput } from '../styled'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'

type UserValueSectionProps = {
	title: string
	value: string
	explanationType: EXPLANATION_MODAL_KEYS
	copyValue: string
}

const UserValueSection: FC<UserValueSectionProps> = ({
	title,
	value,
	explanationType,
	copyValue,
}) => {
	const { handleOpen } = useModalSearchParams()

	const handleOpenExplanationModal = (type: EXPLANATION_MODAL_KEYS) => {
		handleOpen(MODAL_PARAMS_KEYS.EXPLANATION, {
			search: {
				type,
			},
		})
	}
	return (
		<Box>
			<Stack
				direction={'row'}
				alignItems={'center'}
				justifyContent={'space-between'}
				marginBottom={'0.5rem'}
			>
				<SectionTitle>{title}</SectionTitle>
				<AppLink
					title='What is this?'
					onClick={() => handleOpenExplanationModal(explanationType)}
				/>
			</Stack>
			<StyledInput
				value={value}
				readOnly
				endAdornment={<InputCopyButton value={copyValue} />}
			/>
		</Box>
	)
}

export default UserValueSection
