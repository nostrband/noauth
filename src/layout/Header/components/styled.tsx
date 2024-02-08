import { IconButton, IconButtonProps, MenuItem, MenuItemProps, styled } from '@mui/material'

export const MenuButton = styled((props: IconButtonProps) => <IconButton {...props} />)(({ theme }) => {
  const isDark = theme.palette.mode === 'dark'
  return {
    borderRadius: '1rem',
    background: isDark ? '#333333A8' : 'transparent',
    color: isDark ? '#FFFFFFA8' : 'initial',
    width: 42,
    height: 42,
  }
})

export const StyledMenuItem = styled((props: MenuItemProps) => <MenuItem {...props} />)(() => ({
  padding: '0.5rem 1rem',
}))
