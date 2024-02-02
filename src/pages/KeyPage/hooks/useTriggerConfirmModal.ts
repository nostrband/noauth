import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { DbPending, DbPerm } from '@/modules/db'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { ACTION_TYPE } from '@/utils/consts'
import { useCallback, useEffect, useRef } from 'react'

export type IPendingsByAppNpub = {
	[appNpub: string]: {
		pending: DbPending[]
		isConnected: boolean
	}
}

type IShownConfirmModals = {
	[reqId: string]: boolean
}

export const useTriggerConfirmModal = (
	npub: string,
	pending: DbPending[],
	perms: DbPerm[],
) => {
	const { handleOpen, getModalOpened } = useModalSearchParams()

	const isConfirmConnectModalOpened = getModalOpened(
		MODAL_PARAMS_KEYS.CONFIRM_CONNECT,
	)
	const isConfirmEventModalOpened = getModalOpened(
		MODAL_PARAMS_KEYS.CONFIRM_EVENT,
	)

	const filteredPendingReqs = pending.filter((p) => p.npub === npub)
	const filteredPerms = perms.filter((p) => p.npub === npub)

	const npubConnectPerms = filteredPerms.filter(
		(perm) => perm.perm === 'connect' || perm.perm === ACTION_TYPE.BASIC,
	)
	const excludeConnectPendings = filteredPendingReqs.filter(
		(pr) => pr.method !== 'connect',
	)
	const connectPendings = filteredPendingReqs.filter(
		(pr) => pr.method === 'connect',
	)

	const prepareEventPendings =
		excludeConnectPendings.reduce<IPendingsByAppNpub>((acc, current) => {
			const isConnected = npubConnectPerms.some(
				(cp) => cp.appNpub === current.appNpub,
			)
			if (!acc[current.appNpub]) {
				acc[current.appNpub] = {
					pending: [current],
					isConnected,
				}
				return acc
			}
			acc[current.appNpub].pending.push(current)
			acc[current.appNpub].isConnected = isConnected
			return acc
		}, {})

	const shownConnectModals = useRef<IShownConfirmModals>({})
	const shownConfirmEventModals = useRef<IShownConfirmModals>({})

	useEffect(() => {
		return () => {
			shownConnectModals.current = {}
			shownConfirmEventModals.current = {}
		}
	}, [npub, pending.length])

	const handleOpenConfirmConnectModal = useCallback(() => {
		if (
			!filteredPendingReqs.length ||
			isConfirmEventModalOpened ||
			isConfirmConnectModalOpened
		)
			return undefined

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
	])

	const handleOpenConfirmEventModal = useCallback(() => {
		if (!filteredPendingReqs.length || connectPendings.length)
			return undefined

		for (let i = 0; i < Object.keys(prepareEventPendings).length; i++) {
			const appNpub = Object.keys(prepareEventPendings)[i]

			if (
				shownConfirmEventModals.current[appNpub] ||
				!prepareEventPendings[appNpub].isConnected
			) {
				continue
			}

			shownConfirmEventModals.current[appNpub] = true
			handleOpen(MODAL_PARAMS_KEYS.CONFIRM_EVENT, {
				search: {
					appNpub,
				},
			})
			break
		}
	}, [
		connectPendings.length,
		filteredPendingReqs.length,
		handleOpen,
		prepareEventPendings,
	])

	useEffect(() => {
		handleOpenConfirmEventModal()
	}, [handleOpenConfirmEventModal])

	useEffect(() => {
		handleOpenConfirmConnectModal()
	}, [handleOpenConfirmConnectModal])

	return {
		prepareEventPendings,
	}
}
