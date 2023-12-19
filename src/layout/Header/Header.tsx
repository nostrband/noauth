import { Toolbar } from '@mui/material'

import { AppLogo } from '../../assets'
import { StyledAppBar, StyledAppName } from './styled'
import { Menu } from './components/Menu'

export const Header = () => {
	return (
		<StyledAppBar position='static'>
			<Toolbar>
				<StyledAppName>
					<AppLogo />
					<span>Nsec.app</span>
				</StyledAppName>

				<Menu />
			</Toolbar>
		</StyledAppBar>
	)
}
