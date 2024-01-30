import { AppButtonProps, Button } from '@/shared/Button/Button'
import { styled } from '@mui/material'
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded'

export const AddAccountButton = styled((props: AppButtonProps) => (
	<Button {...props} startIcon={<PersonAddAltRoundedIcon />} />
))(() => ({
	alignSelf: 'center',
	padding: '0.35rem 1rem',
}))
