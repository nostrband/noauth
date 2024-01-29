import { FC } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header/Header'
import {
	Container,
	ContainerProps,
	Divider,
	DividerProps,
	styled,
} from '@mui/material'

export const Layout: FC = () => {
	return (
		<StyledContainer maxWidth='md'>
			<Header />
			<StyledDivider />
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
	position: 'relative',
	'& > main': {
		flex: 1,
		maxHeight: '100%',
		paddingTop: 'calc(66px + 1rem)',
	},
})

const StyledDivider = styled((props: DividerProps) => <Divider {...props} />)({
	position: 'absolute',
	top: '66px',
	width: '100%',
	left: 0,
	height: '2px',
})
