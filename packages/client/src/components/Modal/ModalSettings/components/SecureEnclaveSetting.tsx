import { StyledButton, StyledSettingContainer, StyledSynchedText } from '../styled'
import { Stack } from '@mui/material'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { CheckmarkIcon } from '@/assets'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'

const isUploaded = true

export const SecureEnclaveSetting = () => {
  const { handleOpen } = useModalSearchParams()

  const handleSetup = () => {
    handleOpen(MODAL_PARAMS_KEYS.ENCLAVE_SETUP)
  }
  return (
    <StyledSettingContainer>
      <Stack direction={'row'} justifyContent={'space-between'}>
        <SectionTitle>Secure Enclave</SectionTitle>
        {isUploaded && (
          <StyledSynchedText synced={'true'}>
            <CheckmarkIcon /> Uploaded
          </StyledSynchedText>
        )}
      </Stack>
      <StyledButton type="button" fullWidth onClick={handleSetup}>
        Setup
      </StyledButton>
    </StyledSettingContainer>
  )
}
