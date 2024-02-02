import { Avatar, AvatarProps, styled } from '@mui/material'

export const StyledAppIcon = styled((props: AvatarProps) => (
	<Avatar {...props} variant='rounded' />
))(() => ({
	width: 70,
	height: 70,
}))
