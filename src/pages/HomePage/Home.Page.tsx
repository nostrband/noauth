import { Fragment } from 'react'
import { ItemKey } from './components/ItemKey'
import { Box, Stack, Typography } from '@mui/material'
import { AddAccountButton, GetStartedButton, LearnMoreButton } from './styled'
import { useAppSelector } from '@/store/hooks/redux'
import { selectKeys } from '@/store'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { DOMAIN } from '@/utils/consts'

const HomePage = () => {
	const keys = useAppSelector(selectKeys)
	const isNoKeys = !keys || keys.length === 0

	const { handleOpen } = useModalSearchParams()
	const handleClickAddAccount = () => handleOpen(MODAL_PARAMS_KEYS.INITIAL)

	const handleLearnMore = () => {
		// @ts-ignore
		window.open(`https://info.${DOMAIN}`, '_blank').focus();
	}

	return (
		<Stack maxHeight={'100%'} overflow={'auto'}>
			<SectionTitle marginBottom={'0.5rem'}>
				{isNoKeys ? 'Welcome' : 'Keys:'}
			</SectionTitle>
			<Stack gap={'0.5rem'} overflow={'auto'}>
				{isNoKeys && (
					<>
						<Typography textAlign={'left'} variant='h6' paddingTop='1em'>
							Nsec.app is a novel key storage app for Nostr.
						</Typography>
						<GetStartedButton onClick={handleClickAddAccount}>
							Get started
						</GetStartedButton>
						<Typography textAlign={'left'} variant='h6' paddingTop='2em'>
							Your keys are stored in your browser and
							can be used in many Nostr apps without the 
							need for a browser extension. 
						</Typography>
						<LearnMoreButton onClick={handleLearnMore}>
							Learn more
						</LearnMoreButton>
					</>
				)}
				{!isNoKeys && (
					<Fragment>
						<Box
							flex={1}
							overflow={'auto'}
							borderRadius={'8px'}
							padding={'0.25rem'}
						>
							{keys.map((key) => (
								<ItemKey {...key} key={key.npub} />
							))}
						</Box>
						<AddAccountButton onClick={handleClickAddAccount}>
							Add account
						</AddAccountButton>
					</Fragment>
				)}
			</Stack>
		</Stack>
	)
}

export default HomePage
