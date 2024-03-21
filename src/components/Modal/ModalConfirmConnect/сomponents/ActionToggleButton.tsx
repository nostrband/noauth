import { FC } from 'react'
import { ToggleButtonProps, Typography } from '@mui/material'
import { StyledToggleButton } from './styled'

type ActionToggleButtonProps = ToggleButtonProps & {
  description?: string
}

export const ActionToggleButton: FC<ActionToggleButtonProps> = (props) => {
  const { title, description = '' } = props
  return (
    <StyledToggleButton {...props}>
      <Typography variant="body1" noWrap className="title">
        {title}
      </Typography>
      <Typography className="description" variant="caption" color={'GrayText'}>
        {description}
      </Typography>
    </StyledToggleButton>
  )
}
