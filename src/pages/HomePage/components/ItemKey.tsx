import { FC } from 'react'
import { DbKey } from '../../../modules/db'
import {
	Avatar,
	Stack,
	StackProps,
	Typography,
	TypographyProps,
	styled,
} from '@mui/material'
import { getShortenNpub } from '../../../utils/helpers/helpers'
import { useNavigate } from 'react-router-dom'

type ItemKeyProps = DbKey

export const ItemKey: FC<ItemKeyProps> = (props) => {
	const { npub, profile } = props
	const navigate = useNavigate()

	const handleNavigate = () => {
		navigate('/key/' + npub)
	}
	const { name = '', picture = '' } = profile?.info || {}
	const userName = name || getShortenNpub(npub)
	const userAvatar = picture || ''

	return (
		<StyledKeyContainer onClick={handleNavigate}>
			<Stack direction={'row'} alignItems={'center'} gap='1rem'>
				<Avatar src={userAvatar} alt={userName} />
				<StyledText variant='body1'>{userName}</StyledText>
			</Stack>
		</StyledKeyContainer>
	)
}

const StyledKeyContainer = styled((props: StackProps) => (
	<Stack marginBottom={'0.5rem'} gap={'0.25rem'} {...props} />
))(({ theme }) => {
	return {
		boxShadow:
			theme.palette.mode === 'dark'
				? '2px 2px 8px 0px rgba(92, 92, 92, 0.2)'
				: '2px 2px 8px 0px rgba(0, 0, 0, 0.2)',
		borderRadius: '12px',
		padding: '0.5rem 1rem',
		background: theme.palette.background.paper,
		':hover': {
			background: `${theme.palette.background.paper}95`,
		},
		cursor: 'pointer',
	}
})

export const StyledText = styled((props: TypographyProps) => (
	<Typography {...props} />
))({
	fontWeight: 500,
	width: '100%',
	wordBreak: 'break-all',
})
