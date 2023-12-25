import React, { FC, ReactNode } from 'react'
import { IconContainer, StyledContainer } from './styled'
import { BoxProps, Typography } from '@mui/material'

type WarningProps = {
	message: string | ReactNode
	Icon?: ReactNode
} & BoxProps

export const Warning: FC<WarningProps> = ({ message, Icon, ...restProps }) => {
	return (
		<StyledContainer {...restProps}>
			{Icon && <IconContainer>{Icon}</IconContainer>}
			<Typography flex={1} noWrap>
				{message}
			</Typography>
		</StyledContainer>
	)
}
