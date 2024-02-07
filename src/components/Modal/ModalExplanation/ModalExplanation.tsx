import { FC } from 'react'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Stack, Typography } from '@mui/material'
import { Button } from '@/shared/Button/Button'
import { useSearchParams } from 'react-router-dom'

type ModalExplanationProps = {
  explanationText?: string
}

export const ModalExplanation: FC<ModalExplanationProps> = ({ explanationText = '' }) => {
  const { getModalOpened } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.EXPLANATION)
  const [searchParams, setSearchParams] = useSearchParams()

  const handleCloseModal = () => {
    searchParams.delete('type')
    searchParams.delete(MODAL_PARAMS_KEYS.EXPLANATION)
    setSearchParams(searchParams)
  }

  return (
    <Modal
      title="What is this?"
      open={isModalOpened}
      onClose={handleCloseModal}
      PaperProps={{
        sx: {
          minHeight: '60%',
        },
      }}
    >
      <Stack height={'100%'}>
        <Typography flex={1}>{explanationText}</Typography>
        <Button fullWidth onClick={handleCloseModal}>
          Got it!
        </Button>
      </Stack>
    </Modal>
  )
}
