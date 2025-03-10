import { Stack } from '@mui/material'
import { FC, useEffect, useState } from 'react'
import { ItemActivity } from './components/ItemActivity'
import { DbHistory } from '@noauth/common'
import { client } from '@/modules/client'

type ModalActivitiesContentProps = {
  appNpub: string
}

export const ModalActivitiesContent: FC<ModalActivitiesContentProps> = ({ appNpub }) => {
  const [history, setHistory] = useState<DbHistory[]>([])

  useEffect(() => {
    const load = async () => {
      const history = await client.getListHistory(appNpub)
      setHistory(history)
    }
    load()
  }, [appNpub])

  return (
    <Stack overflow={'auto'}>
      {history.map((item) => {
        return <ItemActivity {...item} key={item.id} />
      })}
    </Stack>
  )
}
