// import { useEffect } from 'react'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Button } from '@/shared/Button/Button'
import { Modal } from '@/shared/Modal/Modal'
import { EXPLANATION_MODAL_KEYS, MODAL_PARAMS_KEYS } from '@/types/modal'
import { Stack, Typography } from '@mui/material'
import { StyledSectionContainer } from './styled'
import { AppLink } from '@/shared/AppLink/AppLink'
// import { AppLink } from '@/shared/AppLink/AppLink'

export const ModalInitial = () => {
  const { getModalOpened, createHandleCloseReplace, handleOpen } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.INITIAL)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.INITIAL)

  const handleOpenExplanationModal = () => {
    handleOpen(MODAL_PARAMS_KEYS.EXPLANATION, {
      search: {
        type: EXPLANATION_MODAL_KEYS.HOW,
      },
    })
  }

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal}>
      <Stack paddingTop={'0.5rem'} gap={'0.5rem'}>
        <StyledSectionContainer>
          <Typography noWrap paddingLeft={'0.5rem'} variant="body2" textAlign={'center'}>
            Generate new Nostr keys to try it
          </Typography>
          <Button onClick={() => handleOpen(MODAL_PARAMS_KEYS.SIGN_UP)}>Try nsec.app</Button>
        </StyledSectionContainer>

        <StyledSectionContainer>
          <Typography noWrap paddingLeft={'0.5rem'} variant="body2" textAlign={'center'}>
            Import your real keys
          </Typography>
          <Button onClick={() => handleOpen(MODAL_PARAMS_KEYS.IMPORT_KEYS)}>Import nsec</Button>
        </StyledSectionContainer>

        <StyledSectionContainer>
          <Typography noWrap paddingLeft={'0.5rem'} variant="body2" textAlign={'center'}>
            Sync keys to this device
          </Typography>
          <Button onClick={() => handleOpen(MODAL_PARAMS_KEYS.LOGIN)}>Login</Button>
        </StyledSectionContainer>

        <Stack alignItems={'center'}>
          <AppLink title="How it works?" onClick={() => handleOpenExplanationModal()} />
        </Stack>
      </Stack>
    </Modal>
  )
}
