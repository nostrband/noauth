import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { DbPending, DbPerm } from '@/modules/db'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { ACTION_TYPE, REQ_TTL } from '@/utils/consts'
import { useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

export type IPendingsByAppNpub = {
  [appNpub: string]: {
    pending: DbPending[]
    isConnected: boolean
  }
}

type IShownConfirmModals = {
  [reqId: string]: boolean
}

export const useTriggerConfirmModal = (npub: string, pending: DbPending[], perms: DbPerm[]) => {
  const { handleOpen, getModalOpened } = useModalSearchParams()

  const [searchParams] = useSearchParams()
  const isPopup = searchParams.get('popup') === 'true'

  const isConfirmConnectModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONFIRM_CONNECT)
  const isConfirmEventModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONFIRM_EVENT)

  const filteredPendingReqs = pending.filter((p) => p.npub === npub && p.timestamp > Date.now() - REQ_TTL)
  const filteredPerms = perms.filter((p) => p.npub === npub)

  const npubConnectPerms = filteredPerms.filter((perm) => perm.perm === 'connect' || perm.perm === ACTION_TYPE.BASIC)
  const excludeConnectPendings = filteredPendingReqs.filter((pr) => pr.method !== 'connect')
  const connectPendings = filteredPendingReqs.filter((pr) => pr.method === 'connect')

  const shownConnectModals = useRef<IShownConfirmModals>({})
  const shownConfirmEventModals = useRef<IShownConfirmModals>({})

  useEffect(() => {
    return () => {
      shownConnectModals.current = {}
      shownConfirmEventModals.current = {}
    }
  }, [npub, pending.length])

  const handleOpenConfirmConnectModal = useCallback(() => {
    if (!filteredPendingReqs.length || isConfirmEventModalOpened || isConfirmConnectModalOpened) return undefined

    for (let i = 0; i < connectPendings.length; i++) {
      const req = connectPendings[i]
      if (shownConnectModals.current[req.id]) {
        continue
      }

      shownConnectModals.current[req.id] = true
      handleOpen(MODAL_PARAMS_KEYS.CONFIRM_CONNECT, {
        search: {
          appNpub: req.appNpub,
          reqId: req.id,
          popup: isPopup ? 'true' : '',
        },
      })
      break
    }
  }, [
    connectPendings,
    filteredPendingReqs.length,
    handleOpen,
    isConfirmEventModalOpened,
    isConfirmConnectModalOpened,
    isPopup,
  ])

  const handleOpenConfirmEventModal = useCallback(() => {
    const isNotAllowed =
      !filteredPendingReqs.length || connectPendings.length || isConfirmEventModalOpened || isConfirmConnectModalOpened

    if (isNotAllowed) return undefined

    for (let i = 0; i < excludeConnectPendings.length; i++) {
      const req = excludeConnectPendings[i]
      const isAppConnnected = npubConnectPerms.some((cp) => cp.appNpub === req.appNpub)
      const isShown = !!shownConfirmEventModals.current[req.id]
      if (isShown || !isAppConnnected) {
        continue
      }

      shownConfirmEventModals.current[req.id] = true
      handleOpen(MODAL_PARAMS_KEYS.CONFIRM_EVENT, {
        search: {
          appNpub: req.appNpub,
          popup: isPopup ? 'true' : '',
          reqId: req.id,
        },
      })
      break
    }
  }, [
    filteredPendingReqs,
    connectPendings,
    isConfirmEventModalOpened,
    isConfirmConnectModalOpened,
    excludeConnectPendings,
    npubConnectPerms,
    handleOpen,
    isPopup,
  ])

  useEffect(() => {
    handleOpenConfirmEventModal()
  }, [handleOpenConfirmEventModal])

  useEffect(() => {
    handleOpenConfirmConnectModal()
  }, [handleOpenConfirmConnectModal])
}
