import { StyledButton, StyledSettingContainer, StyledSynchedText } from '../styled'
import { Stack, Typography } from '@mui/material'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { CheckmarkIcon } from '@/assets'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { useEffect, useState } from 'react'
import { client } from '@/modules/client'
import { useParams } from 'react-router-dom'

export const SecureEnclaveSetting = () => {
  const { npub = '' } = useParams<{ npub: string }>()
  const { handleOpen } = useModalSearchParams()
  const [uploaded, setUploaded] = useState('')

  useEffect(() => {
    client.getKeyEnclaveInfo(npub).then((r) => {
      const has = !!r.enclaves.find((e: { has: boolean }) => e.has)
      setUploaded(has ? 'true' : 'false')
    })
  }, [npub])

  const handleSetup = () => {
    handleOpen(MODAL_PARAMS_KEYS.ENCLAVE_SETUP)
  }
  return (
    <StyledSettingContainer>
      <Stack direction={'row'} justifyContent={'space-between'}>
        <SectionTitle>Secure Enclave</SectionTitle>
        {uploaded === 'true' && (
          <StyledSynchedText synced={'true'}>
            <CheckmarkIcon /> Uploaded
          </StyledSynchedText>
        )}
      </Stack>
      <Typography variant="body2" color={'GrayText'}>
        EXPERIMENTAL: Upload your key to a signer running in a trusted execution environment.
      </Typography>
      <StyledButton type="button" fullWidth onClick={handleSetup}>
        Setup
      </StyledButton>
    </StyledSettingContainer>
  )
}
