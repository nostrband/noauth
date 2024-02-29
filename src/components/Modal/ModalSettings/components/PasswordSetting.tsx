import { FC } from 'react'
import { StyledButton, StyledSettingContainer, StyledSynchedText } from '../styled'
import { Stack, Typography } from '@mui/material'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { CheckmarkIcon } from '@/assets'
import WarningIcon from '@mui/icons-material/ReportGmailerrorredRounded'

type PasswordSettingProps = {
  isSynced: boolean
}

export const PasswordSetting: FC<PasswordSettingProps> = () => {
  const isSynced = false
  return (
    <StyledSettingContainer>
      <Stack direction={'row'} justifyContent={'space-between'} alignItems={'start'}>
        <SectionTitle>Password</SectionTitle>

        {isSynced && (
          <StyledSynchedText synced>
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
        <StyledButton type="button" fullWidth>
          Change password
        </StyledButton>
      )}
      {!isSynced && (
        <Stack gap={'1rem'}>
          <Typography variant="body2" color={'GrayText'}>
            Please specify password to enable key export and to safely sync keys to other devices
          </Typography>
          <StyledButton type="button" fullWidth>
            Set password
          </StyledButton>
        </Stack>
      )}
    </StyledSettingContainer>
  )
}
