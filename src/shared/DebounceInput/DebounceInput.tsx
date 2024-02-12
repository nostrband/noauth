import { useRef } from 'react'
import { Input, AppInputProps } from '../Input/Input'

export type DebounceProps = {
  handleDebounce: (value: string) => void
  debounceTimeout: number
}

export const DebounceInput = (props: AppInputProps & DebounceProps) => {
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
