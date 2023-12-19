import { Typography, TypographyProps, styled } from '@mui/material'
import { FC, PropsWithChildren } from 'react'

export const SectionTitle: FC<PropsWithChildren> = ({ children }) => {
	return <StyledTypography>{children}</StyledTypography>
}

const StyledTypography = styled((props: TypographyProps) => (
	<Typography {...props} variant='body1' />
))(({ theme }) => ({
	textTransform: 'uppercase',
	letterSpacing: '3px',
	display: 'block',
	marginBottom: '0.5rem',
	color: theme.palette.text.secondary,
}))
