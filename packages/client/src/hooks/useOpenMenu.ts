import React, { useState } from 'react'

export const useOpenMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const open = Boolean(anchorEl)

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  return {
    open,
    handleOpen,
    handleClose,
    anchorEl,
  }
}
