import { AppButtonProps, Button } from '@/shared/Button/Button'
import { styled } from '@mui/material'

export const PermissionMenuButton = styled((props: AppButtonProps) => (
	<Button {...props} variant='outlined' fullWidth />
))(() => ({}))
