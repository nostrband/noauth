export type ModalStep = 'password' | 'backup' | 'finish'

export const MODAL_STEPS: ModalStep[] = ['password', 'backup', 'finish']

export const getModalTitle = (step: ModalStep) => {
  if (step === 'password') return 'Finishing sign-up'
  if (step === 'backup') return 'Key backup'
  if (step === 'finish') return 'Sign-up complete'
  return ''
}
