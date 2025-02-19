import { FC } from 'react'
import { StyledButton, StyledSettingContainer } from '../styled'
import { Stack, Typography } from '@mui/material'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'

export const RelaysSetting: FC = () => {
  const { handleOpen } = useModalSearchParams()

  const handleOpenRelaysModal = () => {
    handleOpen(MODAL_PARAMS_KEYS.RELAYS)
  }
  return (
    <StyledSettingContainer>
      <Stack direction={'row'} justifyContent={'space-between'}>
        <SectionTitle>Your relays</SectionTitle>
      </Stack>
      <Typography variant="body2" color={'GrayText'}>
        You can customize your relay list
      </Typography>
      <StyledButton type="button" fullWidth onClick={handleOpenRelaysModal}>
        View the list
      </StyledButton>
    </StyledSettingContainer>
  )
}
