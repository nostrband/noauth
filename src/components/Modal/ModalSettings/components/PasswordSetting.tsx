import { FC } from 'react'
import { StyledButton, StyledSettingContainer, StyledSynchedText } from '../styled'
import { Stack, Typography } from '@mui/material'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { CheckmarkIcon } from '@/assets'
import WarningIcon from '@mui/icons-material/ReportGmailerrorredRounded'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'

type PasswordSettingProps = {
  isSynced: boolean
}

export const PasswordSetting: FC<PasswordSettingProps> = ({ isSynced }) => {
  const { handleOpen } = useModalSearchParams()

  const handleOpenSetPasswordModal = () => {
    handleOpen(MODAL_PARAMS_KEYS.SET_PASSWORD)
  }

  return (
    <StyledSettingContainer>
      <Stack direction={'row'} justifyContent={'space-between'} alignItems={'start'}>
        <SectionTitle>Password</SectionTitle>

        {isSynced && (
          <StyledSynchedText synced={'true'}>
            <CheckmarkIcon /> Enabled
          </StyledSynchedText>
        )}
        {!isSynced && (
          <StyledSynchedText>
            <WarningIcon />
            Not enabled
          </StyledSynchedText>
        )}
      </Stack>

      {isSynced && (
        <Stack gap={'1rem'}>
          <Typography variant="body2" color={'GrayText'}>
            Your password is used for key encryption and cloud sync
          </Typography>
          <StyledButton type="button" fullWidth onClick={handleOpenSetPasswordModal}>
            Change password
          </StyledButton>
        </Stack>
      )}
      {!isSynced && (
        <Stack gap={'1rem'}>
          <Typography variant="body2" color={'GrayText'}>
            Please specify password to enable key export and to safely sync keys to other devices
          </Typography>
          <StyledButton type="button" fullWidth onClick={handleOpenSetPasswordModal}>
            Set password
          </StyledButton>
        </Stack>
      )}
    </StyledSettingContainer>
  )
}
