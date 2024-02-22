import { Avatar, Box, styled } from '@mui/material'
import { forwardRef } from 'react'
import { IAvatarStyled, IBoxStyled } from './types'
import { grey } from '@mui/material/colors'
import { AppNostrSize } from '@/types/app-nsec'
import { APP_NAME_FONT_SIZE_VALUE, APP_SIZE_VALUE } from './const'
import { APP_NSEC_SIZE } from '@/utils/consts'

const color = grey[500]

const getVariantApp = (isRounded: boolean, size: AppNostrSize) => {
  if (isRounded) {
    return {
      height: 34,
      minWidth: 34,
      maxWidth: 34,
      borderRadius: '7px',
    }
  }

  return APP_SIZE_VALUE[size]
}

export const StyledAppIcon = styled(
  forwardRef<HTMLAnchorElement, IBoxStyled>(function BoxDisplayName(props, ref) {
    return <Box ref={ref} {...props} />
  })
)(({ theme, isNotLoaded, isRounded = false, size = APP_NSEC_SIZE.MEDIUM }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  ...getVariantApp(isRounded, size),
  transition: theme.transitions.create(['border-color', 'transition']),
  backgroundColor: isNotLoaded ? color : theme.palette.background.default,
  boxSizing: 'border-box',
  ':active': {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
}))

export const StyledAppImg = styled(function BoxDisplayName(props: IAvatarStyled) {
  return <Avatar variant="square" {...props} />
})(({ isSmall = false, size = APP_NSEC_SIZE.MEDIUM }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  width: '100%',
  fontWeight: '500',
  fontSize: APP_NAME_FONT_SIZE_VALUE[size],
  '.MuiAvatar-img': {
    objectFit: isSmall ? 'scale-down' : 'cover',
  },
}))
