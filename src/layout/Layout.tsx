import { FC } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header/Header'
import { Container, ContainerProps, styled } from '@mui/material'

export const Layout: FC = () => {
	return (
		<StyledContainer maxWidth='md'>
			<Header />
			<main>
				<Outlet />
			</main>
		</StyledContainer>
	)
}

const StyledContainer = styled((props: ContainerProps) => (
	<Container maxWidth='sm' {...props} />
))({
	height: '100%',
	display: 'flex',
	flexDirection: 'column',
	paddingBottom: '1rem',
	'& > main': {
		flex: 1,
	},
})
