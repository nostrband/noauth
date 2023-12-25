import { FC, useRef } from 'react'
import { DbKey } from '../../../modules/db'
import { nip19 } from 'nostr-tools'
import { NIP46_RELAYS } from '../../../utils/consts'
import {
	Box,
	IconButton,
	Stack,
	StackProps,
	Typography,
	TypographyProps,
	styled,
} from '@mui/material'
import { call, log } from '../../../utils/helpers'
import { swicCall } from '../../../modules/swic'
import { useNavigate } from 'react-router-dom'
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt'

type ItemKeyProps = DbKey

export const ItemKey: FC<ItemKeyProps> = ({ npub }) => {
	const navigate = useNavigate()
	const { data: pubkey } = nip19.decode(npub)
	const str = `bunker://${pubkey}?relay=${NIP46_RELAYS[0]}`

	const passPhraseInputRef = useRef<HTMLInputElement | null>(null)

	// eslint-disable-next-line
	async function saveKey(npub: string) {
		call(async () => {
			const passphrase = passPhraseInputRef.current?.value
			await swicCall('saveKey', npub, passphrase)
			log('Key saved')
		})
	}

	const handleNavigate = () => {
		navigate('/key/' + npub)
	}

	return (
		<StyledKeyContainer>
			<StyledText variant='body1'>{npub}</StyledText>
			<StyledText variant='body2' color={'#757575'}>
				{str}
			</StyledText>
			{/* <Stack direction={'row'} alignItems={'center'} gap={'0.5rem'}>
				<TextField
					ref={passPhraseInputRef}
					placeholder='save password'
					fullWidth
					size='small'
				/>
				<Button variant='contained' onClick={() => saveKey(npub)}>
					save
				</Button>
			</Stack> */}
			<Box alignSelf={'flex-end'}>
				<IconButton onClick={handleNavigate}>
					<ArrowRightAltIcon />
				</IconButton>
			</Box>
		</StyledKeyContainer>
	)
}

const StyledKeyContainer = styled((props: StackProps) => (
	<Stack marginBottom={'0.5rem'} gap={'0.25rem'} {...props} />
))(({ theme }) => {
	return {
		boxShadow:
			theme.palette.mode === 'dark'
				? '4px 3px 10px 2px rgba(92, 92, 92, 0.2)'
				: '4px 3px 10px 3px rgba(0, 0, 0, 0.2)',
		borderRadius: theme.shape.borderRadius,
		padding: '0.5rem 1rem',
		background: theme.palette.background.paper,
	}
})

export const StyledText = styled((props: TypographyProps) => (
	<Typography {...props} />
))({
	fontWeight: 500,
	width: '100%',
	wordBreak: 'break-all',
})
