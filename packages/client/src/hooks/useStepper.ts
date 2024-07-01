import { useState, useCallback } from 'react'

interface UseStepperReturn {
  activeStep: number
  isLastStep: boolean
  handleNext: () => void
  handleBack: () => void
  handleReset: () => void
}

const useStepper = <T>(steps: T[]): UseStepperReturn => {
  const [activeStep, setActiveStep] = useState(0)

  const isLastStep = activeStep === steps.length - 1

  const handleNext = useCallback(() => {
    setActiveStep((prevActiveStep) => {
      if (prevActiveStep >= steps.length) return prevActiveStep
      return prevActiveStep + 1
    })
  }, [steps])

  const handleBack = useCallback(() => {
    setActiveStep((prevActiveStep) => (prevActiveStep === 1 ? 0 : prevActiveStep - 1))
  }, [])

  const handleReset = useCallback(() => {
    setActiveStep(0)
  }, [])

  return { activeStep, isLastStep, handleNext, handleBack, handleReset }
}

export default useStepper
