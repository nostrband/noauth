import React, { FC, ReactNode } from 'react'
import { StyledMenuItem } from './styled'
import { ListItemIcon, MenuItemProps as MuiMenuItemProps, Typography } from '@mui/material'

type MenuItemProps = {
  onClick: () => void
  title: string
  Icon: ReactNode
} & MuiMenuItemProps

export const MenuItem: FC<MenuItemProps> = ({ onClick, Icon, title }) => {
  return (
    <StyledMenuItem onClick={onClick}>
      <ListItemIcon>{Icon}</ListItemIcon>
      <Typography fontWeight={500} variant="body2" noWrap>
        {title}
      </Typography>
    </StyledMenuItem>
  )
}
