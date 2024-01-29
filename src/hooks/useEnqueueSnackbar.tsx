import {
	useSnackbar as useDefaultSnackbar,
	OptionsObject,
	VariantType,
} from 'notistack'
import { Notification } from '../components/Notification/Notification'

export const useEnqueueSnackbar = () => {
	const { enqueueSnackbar } = useDefaultSnackbar()

	const showSnackbar = (
		message: string,
		variant: Exclude<VariantType, 'default' | 'info'> = 'success',
	) => {
		enqueueSnackbar(message, {
			anchorOrigin: {
				vertical: 'top',
				horizontal: 'right',
			},
			content: (id) => {
				return (
					<Notification
						id={id}
						message={message}
						alertvariant={variant}
					/>
				)
			},
		} as OptionsObject)
	}

	return showSnackbar
}
