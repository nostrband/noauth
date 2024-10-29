import { FC, useEffect, useState } from 'react'
import { Fade, Typography } from '@mui/material'
import CopyToClipboard from 'react-copy-to-clipboard'
import { StyledContainer, StyledCopyButton } from './styled'

type InputCopyButtonProps = {
  value: string
  onCopy?: () => void
}

export const InputCopyButton: FC<InputCopyButtonProps> = ({ value, onCopy = () => undefined }) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = () => {
    setIsCopied(true)
    onCopy && onCopy()
  }

  useEffect(() => {
    let timerId: any

    if (!isCopied) return clearTimeout(timerId)

    timerId = setTimeout(() => {
      setIsCopied(false)
    }, 2000)

    return () => {
      clearTimeout(timerId)
    }
  }, [isCopied])
  return (
    <StyledContainer copied={isCopied ? 1 : 0}>
      {isCopied && (
        <Fade in exit>
          <Typography marginLeft={'0.5rem'} variant="body2" color={'inherit'}>
            Copied
          </Typography>
        </Fade>
      )}
      <CopyToClipboard text={value} onCopy={handleCopy}>
        <StyledCopyButton />
      </CopyToClipboard>
    </StyledContainer>
  )
}
