import React, { FC } from 'react'
import { Modal } from '@/shared/Modal/Modal'
import { Stack } from '@mui/material'
import { useLiveQuery } from 'dexie-react-hooks'
import { HistoryDefaultValue, getActivityHistoryQuerier } from './utils'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { ItemActivity } from '@/components/Modal/ModalActivities/components/ItemActivity'

type ModalActivitiesProps = {
  appNpub: string
}

export const ModalActivities: FC<ModalActivitiesProps> = ({ appNpub }) => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.ACTIVITY)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.ACTIVITY)

  const history = useLiveQuery(getActivityHistoryQuerier(appNpub), [], HistoryDefaultValue)

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal} fixedHeight="calc(100% - 5rem)" title="Activity history">
      <Stack overflow={'auto'} gap={'0.5rem'}>
        {history.map((item) => {
          return <ItemActivity {...item} key={item.id} />
        })}
      </Stack>
    </Modal>
  )
}
