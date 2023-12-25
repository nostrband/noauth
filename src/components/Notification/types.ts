import { AlertProps } from '@mui/material'
import { SnackbarKey, VariantType } from 'notistack'

export type StyledAlertProps = Omit<AlertProps, 'id'> & {
	alertvariant: Exclude<VariantType, 'default' | 'info'>
}

export type NotificationProps = {
	message: string
	id: SnackbarKey
} & StyledAlertProps
