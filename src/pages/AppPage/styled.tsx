import { AppButtonProps, Button } from '@/shared/Button/Button'
import { styled } from '@mui/material'

export const StyledButton = styled((props: AppButtonProps) => (
	<Button {...props} variant='outlined' fullWidth />
))(() => ({}))
