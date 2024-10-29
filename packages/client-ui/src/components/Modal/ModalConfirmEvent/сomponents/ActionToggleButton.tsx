import { FC } from 'react'
import { ToggleButtonProps, Typography } from '@mui/material'
import { StyledToggleButton } from './styled'

type ActionToggleButtonProps = ToggleButtonProps & {
  hasinfo?: boolean
}

export const ActionToggleButton: FC<ActionToggleButtonProps> = ({ hasinfo = false, ...props }) => {
  const { title } = props
  return (
    <StyledToggleButton {...props}>
      <Typography variant="body2">{title}</Typography>
      {hasinfo && (
        <Typography className="info" color={'GrayText'}>
          Info
        </Typography>
      )}
    </StyledToggleButton>
  )
}
