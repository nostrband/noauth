import { Typography, TypographyProps, styled } from '@mui/material'
import { FC, PropsWithChildren } from 'react'

export const SectionTitle: FC<PropsWithChildren> = ({ children }) => {
	return <StyledTypography>{children}</StyledTypography>
}

const StyledTypography = styled((props: TypographyProps) => (
	<Typography {...props} variant='caption' />
))(({ theme }) => {
	const isDark = theme.palette.mode === 'dark'
	return {
		textTransform: 'uppercase',
		letterSpacing: '3px',
		display: 'block',
		color: isDark ? '#FFFFFF' : theme.palette.textSecondaryDecorate.main,
		fontWeight: 600,
	}
})
