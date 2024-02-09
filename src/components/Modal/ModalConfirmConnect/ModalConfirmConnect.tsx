import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { call, getAppIconTitle, getDomain, getShortenNpub } from '@/utils/helpers/helpers'
import { Avatar, Box, Stack, Typography } from '@mui/material'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks/redux'
import { selectAppsByNpub } from '@/store'
import { StyledButton, StyledToggleButtonsGroup } from './styled'
import { ActionToggleButton } from './сomponents/ActionToggleButton'
import { useState } from 'react'
import { swicCall } from '@/modules/swic'
import { ACTION_TYPE } from '@/utils/consts'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'

export const ModalConfirmConnect = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const notify = useEnqueueSnackbar()
  const navigate = useNavigate()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONFIRM_CONNECT)

  const [searchParams] = useSearchParams()
  const paramNpub = searchParams.get('npub') || ''
  const { npub = paramNpub } = useParams<{ npub: string }>()
  const apps = useAppSelector((state) => selectAppsByNpub(state, npub))

  const [selectedActionType, setSelectedActionType] = useState<ACTION_TYPE>(ACTION_TYPE.BASIC)

  const appNpub = searchParams.get('appNpub') || ''
  const pendingReqId = searchParams.get('reqId') || ''
  const isPopup = searchParams.get('popup') === 'true'
  const token = searchParams.get('token') || ''

  const triggerApp = apps.find((app) => app.appNpub === appNpub)
  const { name, url = '', icon = '' } = triggerApp || {}

	let appUrl = url || searchParams.get('appUrl') || ''
	console.log("referrer", window.document.referrer, appUrl)
	if (!appUrl && window.document.referrer) {
		try {
			const u = new URL(window.document.referrer)
			appUrl = u.origin
		} catch {}
	}

  const appDomain = getDomain(appUrl)
  const appName = name || appDomain || getShortenNpub(appNpub)
  const appAvatarTitle = getAppIconTitle(name || appDomain, appNpub)
  const appIcon = icon || (appDomain ? `https://${appDomain}/favicon.ico` : '')

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
      sp.delete('popup')
      sp.delete('npub')
      sp.delete('appUrl')
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

  const allow = async () => {
    let perms = ['connect', 'get_public_key']
    if (selectedActionType === ACTION_TYPE.BASIC) perms = [ACTION_TYPE.BASIC]

    if (pendingReqId) {
      const options = { perms, appUrl }
      await confirmPending(pendingReqId, true, true, options)
    } else {
      try {
        await swicCall('enablePush')
        console.log('enablePush done')
      } catch (e: any) {
        console.log('error', e)
        notify('Please enable Notifications in website settings!', 'error')
        return
      }

      try {
        await swicCall('connectApp', { npub, appNpub, appUrl, perms })
        console.log('connectApp done', npub, appNpub, appUrl, perms)
      } catch (e: any) {
        notify(e.toString(), 'error')
        return
      }

      if (token) {
        try {
          await swicCall('redeemToken', npub, token)
          console.log('redeemToken done')
        } catch (e) {
          console.log('error', e)
          notify('App did not reply. Please try to log in now.', 'error')
          navigate(`/key/${npub}`, { replace: true })
          return
        }
      }

      notify('App connected! Closing...', 'success')

      if (isPopup) setTimeout(() => window.close(), 3000)
      else navigate(`/key/${npub}`, { replace: true })
    }
  }

  const disallow = () => {
    if (pendingReqId) confirmPending(pendingReqId, false, true)
    else closeModalAfterRequest()
  }

  if (isPopup) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        disallow()
      }
    })
  }

  return (
    <Modal
      title="Connection request"
      open={isModalOpened}
      withCloseButton={false}
      //  withCloseButton={!isPopup} onClose={!isPopup ? handleCloseModal : undefined}
    >
      <Stack gap={'1rem'} paddingTop={'1rem'}>
        {!pendingReqId && (
          <Typography variant="body1" color={'GrayText'}>
            You will be asked to <b>enable notifications</b>, this
						is needed for a reliable communication with Nostr apps.  
          </Typography>
        )}
        <Stack direction={'row'} gap={'1rem'} alignItems={'center'} marginBottom={'1rem'}>
          <Avatar
            variant="rounded"
            sx={{
              width: 56,
              height: 56,
            }}
            src={appIcon}
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
