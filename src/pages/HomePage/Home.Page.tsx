import { useAppSelector } from '../../store/hooks/redux'
import { selectKeys } from '../../store'
import { ItemKey } from './components/ItemKey'
import { Stack } from '@mui/material'
import { SectionTitle } from '../../shared/SectionTitle/SectionTitle'

const HomePage = () => {
	const keys = useAppSelector(selectKeys)

	return (
		<Stack>
			<SectionTitle>Keys:</SectionTitle>
			<Stack gap={'0.5rem'}>
				{keys.map((key) => (
					<ItemKey {...key} key={key.npub} />
				))}
			</Stack>
		</Stack>
	)
}

export default HomePage
