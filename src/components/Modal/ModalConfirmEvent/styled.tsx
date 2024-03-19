import { AppButtonProps, Button } from '@/shared/Button/Button'
import {
  Avatar,
  AvatarProps,
  Stack,
  StackProps,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
  Typography,
  TypographyProps,
  styled,
} from '@mui/material'

export const Container = styled((props: StackProps) => <Stack {...props} />)(() => ({
  gap: '1rem',
  paddingTop: '1rem',
  '@media screen and (max-width: 320px)': {
    gap: '0.5rem',
    paddingTop: '0.5rem',
  },
}))

export const StyledButton = styled((props: AppButtonProps) => <Button {...props} />)(() => ({
  borderRadius: '19px',
  fontWeight: 600,
  padding: '0.75rem 1rem',
  maxHeight: '41px',
}))

export const StyledToggleButtonsGroup = styled((props: ToggleButtonGroupProps) => <ToggleButtonGroup {...props} />)(
  () => ({
    gap: '0.75rem',
    marginBottom: '1rem',
    justifyContent: 'space-between',
    '&.MuiToggleButtonGroup-root .MuiToggleButtonGroup-grouped:not(:first-of-type)': {
      margin: '0',
      border: 'initial',
    },
    '&.MuiToggleButtonGroup-root .MuiToggleButtonGroup-grouped': {
      border: 'initial',
      borderRadius: '1rem',
    },
  })
)

export const StyledHeadingContainer = styled((props: StackProps) => <Stack {...props} direction={'row'} />)(() => ({
  gap: '1rem',
  alignItems: 'center',
  marginBottom: '1rem',
}))

export const StyledAvatar = styled((props: AvatarProps) => <Avatar {...props} variant="square" />)({
  width: 56,
  height: 56,
  borderRadius: '12px',
})

export const StyledPre = styled('pre')(({ theme }) => ({
  width: '100%',
  maxHeight: '15rem',
  overflow: 'auto',
  whiteSpace: 'break-spaces',
  fontSize: '14px',
  padding: '0.5rem 1rem',
  background: theme.palette.backgroundSecondary.default,
  borderRadius: '1rem',
  '@media screen and (max-width: 485px)': {
    maxHeight: '10rem',
    fontSize: '12px',
  },
}))

export const StyledActionName = styled((props: TypographyProps) => <Typography {...props} variant="body1" />)(() => ({
  fontWeight: 600,
  fontSize: '18px',
  flex: 1,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}))
