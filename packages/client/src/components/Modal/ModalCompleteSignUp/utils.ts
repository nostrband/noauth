export type ModalStep = 'password' | 'backup' | 'finish'

export const MODAL_STEPS: ModalStep[] = ['password', 'backup', 'finish']

export const getModalTitle = (step: ModalStep) => {
  if (step === 'password') return 'Finishing signup'
  if (step === 'backup') return 'Backup key'
  if (step === 'finish') return 'Signup complete'
  return ''
}
