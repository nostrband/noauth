import { Input } from '@/shared/Input/Input'
import { Stack, useMediaQuery, Typography, useTheme } from '@mui/material'
import { StyledAppLogo, StyledContent } from './styled'
import { Button } from '@/shared/Button/Button'
import { ChangeEvent, useState } from 'react'
import { CheckmarkIcon } from '@/assets'
import { DOMAIN } from '@/utils/consts'

const AuthPage = () => {
	const isMobile = useMediaQuery('(max-width:600px)')

	const [enteredValue, setEnteredValue] = useState('')

	const theme = useTheme()

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		setEnteredValue(e.target.value)
	}

	const isAvailable = enteredValue.trim().length > 2

	const inputHelperText = isAvailable ? (
		<>
			<CheckmarkIcon /> Available
		</>
	) : (
		"Don't worry, username can be changed later."
	)

	const mainContent = (
		<>
			<Input
				label='Enter a Username'
				fullWidth
				placeholder='Username'
				helperText={inputHelperText}
				endAdornment={
					<Typography color={'#FFFFFFA8'}>@{DOMAIN}</Typography>
				}
				onChange={handleInputChange}
				value={enteredValue}
				helperTextProps={{
					sx: {
						'&.helper_text': {
							color: isAvailable
								? theme.palette.success.main
								: theme.palette.textSecondaryDecorate.main,
						},
					},
				}}
			/>
			<Button fullWidth>Sign up</Button>
		</>
	)

	return (
		<Stack height={'100%'} position={'relative'}>
			{isMobile ? (
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
					{mainContent}
				</StyledContent>
			) : (
				<Stack gap={'1rem'} alignItems={'center'}>
					{mainContent}
				</Stack>
			)}
		</Stack>
	)
}

export default AuthPage
