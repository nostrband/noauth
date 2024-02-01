import React, { FC } from 'react'
import { ButtonProps } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import useIsIOS from '@/hooks/useIsIOS'
import { StyledButton } from './styled'

type IOSBackButtonProps = ButtonProps & {
	onNavigate?: () => void
}

export const IOSBackButton: FC<IOSBackButtonProps> = ({ onNavigate }) => {
	const isIOS = useIsIOS()
	const navigate = useNavigate()

	const handleNavigateBack = () => {
		if (onNavigate && typeof onNavigate === 'function') {
			return onNavigate()
		}
		navigate(-1)
	}

	if (!isIOS) return null

	return <StyledButton onClick={handleNavigateBack}>Back</StyledButton>
}
