import { FC } from 'react'
import { Box } from '@mui/material'
import { DbKey } from '@noauth/common'
import { ItemKey } from './ItemKey'

type KeysProps = {
  keys: DbKey[]
}

export const Keys: FC<KeysProps> = ({ keys }) => {
  const handleKeyClick = (key: DbKey) => {
    console.log(key)
  }
  return (
    <Box flex={1} overflow={'auto'} borderRadius={'8px'} maxHeight={'30rem'}>
      {keys.map((key) => (
        <ItemKey {...key} key={key.npub} onKeyClick={() => handleKeyClick(key)} />
      ))}
    </Box>
  )
}
