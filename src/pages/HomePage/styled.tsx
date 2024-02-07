import { AppButtonProps, Button } from '@/shared/Button/Button'
import { styled } from '@mui/material'
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded'
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'

export const AddAccountButton = styled((props: AppButtonProps) => (
  <Button {...props} startIcon={<PersonAddAltRoundedIcon />} />
))(() => ({
  alignSelf: 'center',
  padding: '0.35rem 1rem',
}))

export const GetStartedButton = styled((props: AppButtonProps) => (
  <Button {...props} startIcon={<PlayArrowOutlinedIcon />} />
))(() => ({
  alignSelf: 'left',
  padding: '0.35rem 1rem',
}))

export const LearnMoreButton = styled((props: AppButtonProps) => (
  <Button {...props} startIcon={<HelpOutlineOutlinedIcon />} />
))(() => ({
  alignSelf: 'left',
  padding: '0.35rem 1rem',
}))
