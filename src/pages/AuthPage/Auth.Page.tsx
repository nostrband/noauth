import { Input } from '@/shared/Input/Input'
import {
	Button,
	Stack,
	InputAdornment,
	useMediaQuery,
	Typography,
} from '@mui/material'
import { StyledAppLogo, StyledContent } from './styled'

const AuthPage = () => {
	const isMobile = useMediaQuery('(max-width:600px)')

	const commonContent = (
		<>
			<Input
				label='Enter a Username'
				fullWidth
				placeholder='Username'
				helperText="Don't worry, username can be changed later."
				endAdornment={
					<InputAdornment position='end'>@nsec.app</InputAdornment>
				}
			/>
			<Button variant='contained'>Sign up</Button>
		</>
	)

	const renderContent = () => {
		if (isMobile) {
			return (
				<StyledContent>
					<Stack
						direction={'row'}
						gap={'1rem'}
						alignItems={'center'}
						alignSelf={'flex-start'}
					>
						<StyledAppLogo />
						<Typography fontWeight={600} variant='h5'>
							Sign up
						</Typography>
					</Stack>
					{commonContent}
				</StyledContent>
			)
		}
		return (
			<Stack gap={'1rem'} alignItems={'center'}>
				{commonContent}
			</Stack>
		)
	}

	return (
		<Stack height={'100%'} position={'relative'}>
			{renderContent()}
		</Stack>
	)
}

export default AuthPage
