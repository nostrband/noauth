import { FC, ReactNode } from 'react'
import { IconContainer, StyledContainer } from './styled'
import { BoxProps, Typography } from '@mui/material'

type WarningProps = {
  message?: string | ReactNode
  icon?: ReactNode
} & BoxProps

export const Warning: FC<WarningProps> = ({ message, icon, ...restProps }) => {
  const renderMessage = () => {
    if (typeof message === 'string') {
      return (
        <Typography noWrap width={'100%'}>
          {message}
        </Typography>
      )
    }
    return message
  }
  return (
    <StyledContainer {...restProps}>
      {icon && <IconContainer>{icon}</IconContainer>}
      {renderMessage()}
    </StyledContainer>
  )
}
