import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { call, getAppIconTitle, getShortenNpub } from '@/utils/helpers/helpers'
import { Avatar, Box, Stack, Typography } from '@mui/material'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks/redux'
import { selectAppsByNpub } from '@/store'
import { StyledButton, StyledToggleButtonsGroup } from './styled'
import { ActionToggleButton } from './сomponents/ActionToggleButton'
import { useState } from 'react'
import { swicCall } from '@/modules/swic'
import { ACTION_TYPE } from '@/utils/consts'

export const ModalConfirmConnect = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONFIRM_CONNECT)

  const { npub = '' } = useParams<{ npub: string }>()
  const apps = useAppSelector((state) => selectAppsByNpub(state, npub))

  const [selectedActionType, setSelectedActionType] = useState<ACTION_TYPE>(ACTION_TYPE.BASIC)

  const [searchParams] = useSearchParams()
  const appNpub = searchParams.get('appNpub') || ''
  const pendingReqId = searchParams.get('reqId') || ''
  const isPopup = searchParams.get('popup') === 'true'

  const triggerApp = apps.find((app) => app.appNpub === appNpub)
  const { name, icon = '' } = triggerApp || {}
  const appName = name || getShortenNpub(appNpub)
	const appAvatarTitle = getAppIconTitle(name, appNpub)

  const handleActionTypeChange = (_: any, value: ACTION_TYPE | null) => {
    if (!value) return undefined
    return setSelectedActionType(value)
  }

  // const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.CONFIRM_CONNECT, {
  //   onClose: async (sp) => {
  //     sp.delete('appNpub')
  //     sp.delete('reqId')
  //     await swicCall('confirm', pendingReqId, false, false)
  //   },
  // })
  const closeModalAfterRequest = createHandleCloseReplace(MODAL_PARAMS_KEYS.CONFIRM_CONNECT, {
    onClose: (sp) => {
      sp.delete('appNpub')
      sp.delete('reqId')
    },
  })

  async function confirmPending(id: string, allow: boolean, remember: boolean, options?: any) {
    call(async () => {
      await swicCall('confirm', id, allow, remember, options)
      console.log('confirmed', id, allow, remember, options)
      closeModalAfterRequest()
    })
    if (isPopup) window.close()
  }

  const allow = () => {
    const options: any = {}
    if (selectedActionType === ACTION_TYPE.BASIC) options.perms = [ACTION_TYPE.BASIC]
    // else
    // 	options.perms = ['connect','get_public_key'];
    confirmPending(pendingReqId, true, true, options)
  }

  const disallow = () => {
    confirmPending(pendingReqId, false, true)
  }

  if (isPopup) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        disallow()
      }
    })
  }

  return (
    <Modal title='Connection request' open={isModalOpened} withCloseButton={false}
		//  withCloseButton={!isPopup} onClose={!isPopup ? handleCloseModal : undefined}
		>
      <Stack gap={'1rem'} paddingTop={'1rem'}>
        <Stack direction={'row'} gap={'1rem'} alignItems={'center'} marginBottom={'1rem'}>
          <Avatar
            variant="rounded"
            sx={{
              width: 56,
              height: 56,
            }}
            src={icon}
          >
						{appAvatarTitle}
					</Avatar>
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {appName}
            </Typography>
            <Typography variant="body2" color={'GrayText'}>
              New app would like to connect
            </Typography>
          </Box>
        </Stack>
        <StyledToggleButtonsGroup value={selectedActionType} onChange={handleActionTypeChange} exclusive>
          <ActionToggleButton
            value={ACTION_TYPE.BASIC}
            title="Basic permissions"
            description="Read your public key, sign notes, reactions, zaps, etc"
            // hasinfo
          />
          {/* <ActionToggleButton
						value={ACTION_TYPE.ADVANCED}
						title='Advanced'
						description='Use for trusted apps only'
						hasinfo
					/> */}
          <ActionToggleButton
            value={ACTION_TYPE.CUSTOM}
            title="On demand"
            description="Confirm permissions when the app asks for them"
          />
        </StyledToggleButtonsGroup>
        <Stack direction={'row'} gap={'1rem'}>
          <StyledButton onClick={disallow} varianttype="secondary">
            Disallow
          </StyledButton>
          <StyledButton fullWidth onClick={allow}>
            {/* Allow {selectedActionType} actions */}
            Connect
          </StyledButton>
        </Stack>
      </Stack>
    </Modal>
  )
}
