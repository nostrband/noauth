import { FC } from 'react'
import { ToggleButtonProps, Typography } from '@mui/material'
import { StyledToggleButton } from './styled'

type ActionToggleButtonProps = ToggleButtonProps & {
  description?: string
  hasinfo?: boolean
}

export const ActionToggleButton: FC<ActionToggleButtonProps> = ({ hasinfo = false, ...props }) => {
  const { title, description = '' } = props
  return (
    <StyledToggleButton {...props}>
      <Typography variant="body2">{title}</Typography>
      <Typography className="description" variant="caption" color={'GrayText'}>
        {description}
      </Typography>
      {hasinfo && (
        <Typography className="info" color={'GrayText'}>
          Info
        </Typography>
      )}
    </StyledToggleButton>
  )
}
