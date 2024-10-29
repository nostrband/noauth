import { Avatar, Box, styled } from '@mui/material'
import { forwardRef } from 'react'
import { IAvatarStyled, IBoxStyled } from './types'
import { grey } from '@mui/material/colors'
import { AppNostrSize } from '@/types/app-nsec'
import { APP_NAME_FONT_SIZE_VALUE, APP_SIZE_VALUE } from './const'
import { APP_NSEC_SIZE } from '@/utils/consts'

const color = grey[500]

const getVariantApp = (size: AppNostrSize) => {
  return APP_SIZE_VALUE[size]
}

export const StyledAppIcon = styled(
  forwardRef<HTMLAnchorElement, IBoxStyled>(function BoxDisplayName(props, ref) {
    const exclude = new Set(['isNotLoaded', 'isRounded'])
    const omitProps = Object.fromEntries(Object.entries(props).filter((e) => !exclude.has(e[0])))

    return <Box ref={ref} {...omitProps} />
  })
)(({ theme, isNotLoaded, size = APP_NSEC_SIZE.MEDIUM, isRounded = false }) => ({
  position: 'relative',
  overflow: 'hidden',
  ...getVariantApp(size),
  borderRadius: isRounded ? '50%' : theme.shape.borderRadius,
  transition: theme.transitions.create(['border-color', 'transition']),
  backgroundColor: isNotLoaded ? color : theme.palette.background.default,
  boxSizing: 'border-box',
  ':active': {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
}))

export const StyledAppImg = styled(function BoxDisplayName(props: IAvatarStyled) {
  const exclude = new Set(['isSmall'])
  const omitProps = Object.fromEntries(Object.entries(props).filter((e) => !exclude.has(e[0])))
  return <Avatar variant="square" {...omitProps} />
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
