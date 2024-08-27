import { FC } from 'react'
import { Box } from '@mui/material'
import { DbKey } from '@noauth/common'
import { ItemKey } from './ItemKey'

type KeysProps = {
  keys: DbKey[]
  onKeyClick: (npub: string) => void
  isLoading: boolean
}

export const Keys: FC<KeysProps> = ({ keys, onKeyClick, isLoading }) => {
  const handleKeyClick = (key: DbKey) => {
    if (isLoading) return
    onKeyClick(key.npub)
  }

  return (
    <Box flex={1} overflow={'auto'} borderRadius={'8px'} maxHeight={'30rem'}>
      {keys.map((key) => (
        <ItemKey {...key} key={key.npub} onKeyClick={() => handleKeyClick(key)} />
      ))}
    </Box>
  )
}
