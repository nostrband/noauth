import { ModalCompleteSignUp } from '@/components/Modal/ModalCompleteSignUp/ModalCompleteSignUp'
import { ModalKeyNotFound } from '@/components/Modal/ModalKeyNotFound/ModalKeyNotFound'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CompleteSignUpPage = () => {
  const navigate = useNavigate()
  const [modalKeyNotFoundOpen, setModalKeyNotFound] = useState(false)

  const handleOpen = () => {
    setModalKeyNotFound(true)
  }

  const handleClose = () => {
    setModalKeyNotFound(false)
    navigate('/home')
  }

  return (
    <>
      <ModalCompleteSignUp isKeyNotFoundModalOpened={modalKeyNotFoundOpen} onOpenKeyNotFoundModal={handleOpen} />
      <ModalKeyNotFound open={modalKeyNotFoundOpen} onClose={handleClose} />
    </>
  )
}

export default CompleteSignUpPage
