import { forwardRef, useRef } from 'react'
import { Input, InputProps } from '../Input/Input'

export type DebounceProps = {
  handleDebounce: (value: string) => void
  debounceTimeout: number
}

export const DebounceInput = (props: InputProps & DebounceProps) => {
  const { handleDebounce, debounceTimeout, ...rest } = props

  const timerRef = useRef<number>()

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = window.setTimeout(() => {
      handleDebounce(event.target.value)
    }, debounceTimeout)
  }

  // @ts-ignore
  return <Input {...rest} onChange={handleChange} />
}
