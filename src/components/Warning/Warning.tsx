import { FC, ReactNode } from 'react'
import { IconContainer, StyledContainer } from './styled'
import { BoxProps, Stack, Typography } from '@mui/material'

type WarningProps = {
  message?: string | ReactNode
  hint?: string | ReactNode
  icon?: ReactNode
} & BoxProps

export const Warning: FC<WarningProps> = ({ hint, message, icon, ...restProps }) => {
  return (
    <StyledContainer {...restProps}>
      {icon && <IconContainer>{icon}</IconContainer>}
      <Stack flex={1} direction={'column'} gap={'0.2rem'}>
        <Typography noWrap>
          {message}
        </Typography>
        {hint && (
          <Typography>
            {hint}
          </Typography>
        )}
      </Stack>
    </StyledContainer>
  )
}
