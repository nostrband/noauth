import { ChangeEvent, FC, FormEvent, useState } from 'react'
import { StyledSettingContainer } from '../styled'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { Input } from '@/shared/Input/Input'
import { Button } from '@/shared/Button/Button'
import { IconButton } from '@mui/material'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'

type NewRelayFormProps = {
  onSubmit: (relay: string) => Promise<void>
}

export const NewRelayForm: FC<NewRelayFormProps> = ({ onSubmit }) => {
  const [enteredRelay, setEnteredRelay] = useState('')

  const handleRelayChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEnteredRelay(e.target.value)
  }

  const handleClear = () => {
    setEnteredRelay('')
  }

  const isEmpty = !enteredRelay.trim()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (isEmpty) return

    onSubmit(enteredRelay).then(() => setEnteredRelay(''))
  }

  return (
    <StyledSettingContainer component={'form'} onSubmit={handleSubmit}>
      <SectionTitle>Custom relay</SectionTitle>
      <Input
        placeholder="wss://relay.example.com"
        fullWidth
        label="Address of relay"
        value={enteredRelay}
        onChange={handleRelayChange}
        sx={{ height: 50 }}
        endAdornment={
          isEmpty || (
            <IconButton onClick={handleClear}>
              <ClearRoundedIcon />
            </IconButton>
          )
        }
      />
      <Button type="submit" disabled={isEmpty}>
        Add relay
      </Button>
    </StyledSettingContainer>
  )
}
