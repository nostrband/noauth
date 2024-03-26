import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import {
  askNotificationPermission,
  formatPermSummary,
  getAppIconTitle,
  getDomainPort,
  getReferrerAppUrl,
  getShortenNpub,
  packageToPerms,
  permListToPerms,
} from '@/utils/helpers/helpers'
import { Box, Stack, Typography } from '@mui/material'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks/redux'
import { selectAppsByNpub, selectKeys, selectPendingsByNpub } from '@/store'
import { StyledActionsListContainer, StyledButton, StyledSelectButton, StyledToggleButtonsGroup } from './styled'
import { ActionToggleButton } from './сomponents/ActionToggleButton'
import { useEffect, useState } from 'react'
import { swicCall, swicWaitStarted } from '@/modules/swic'
import { ACTION_TYPE } from '@/utils/consts'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { DbPerm } from '@/modules/db'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { nip19 } from 'nostr-tools'
// import { AppLink } from '@/shared/AppLink/AppLink'
import { IconApp } from '@/shared/IconApp/IconApp'
import { RequestedPermissions } from './сomponents/RequestedPermissions/RequestedPermissions'

type Perm = DbPerm & { checked: boolean }

export const ModalConfirmConnect = () => {
  const keys = useAppSelector(selectKeys)

  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const notify = useEnqueueSnackbar()
  const navigate = useNavigate()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONFIRM_CONNECT)

  const [searchParams, setSearchParams] = useSearchParams()
  const paramNpub = searchParams.get('npub') || ''
  const { npub = paramNpub } = useParams<{ npub: string }>()
  const apps = useAppSelector((state) => selectAppsByNpub(state, npub))
  const pending = useAppSelector((state) => selectPendingsByNpub(state, npub))

  const [isLoaded, setIsLoaded] = useState(false)
  const [perms, setPerms] = useState<Perm[]>([])

  const appNpub = searchParams.get('appNpub') || ''
  const pendingReqId = searchParams.get('reqId') || ''
  const isPopup = searchParams.get('popup') === 'true'
  const token = searchParams.get('token') || ''
  const redirectUri = searchParams.get('redirect_uri') || ''
  const done = searchParams.get('done') === 'true'
  const permsParam = searchParams.get('perms') || ''
  const hasReqPerms = !!permsParam

  const [selectedActionType, setSelectedActionType] = useState<ACTION_TYPE>(
    hasReqPerms ? ACTION_TYPE.REQUESTED : ACTION_TYPE.BASIC
  )
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  const triggerApp = apps.find((app) => app.appNpub === appNpub)
  const { name, url = '', icon = '' } = triggerApp || {}

  const appUrl = url || searchParams.get('appUrl') || getReferrerAppUrl()
  const appDomain = getDomainPort(appUrl)
  const appName = name || appDomain || getShortenNpub(appNpub)
  const appAvatarTitle = getAppIconTitle(name || appDomain, appNpub)
  const appIcon = icon || (appDomain ? `https://${appDomain}/favicon.ico` : '')

  useEffect(() => {
    const list = selectedActionType === ACTION_TYPE.REQUESTED ? permListToPerms(permsParam) : packageToPerms(selectedActionType)
    const perms = list ? list.map(
      (p) =>
        ({
          id: p,
          appNpub,
          npub,
          checked: true,
          perm: p,
          timestamp: Date.now(),
          value: '1',
        }) as Perm
    ) : []
    setPerms(perms)
  }, [selectedActionType, pendingReqId, permsParam, appNpub, npub])

  const closeModalAfterRequest = createHandleCloseReplace(MODAL_PARAMS_KEYS.CONFIRM_CONNECT, {
    onClose: (sp) => {
      sp.delete('appNpub')
      sp.delete('reqId')
      sp.delete('popup')
      sp.delete('npub')
      sp.delete('appUrl')
      sp.delete('token')
      sp.delete('redirect_uri')
      sp.delete('perms')
      setShowAdvancedOptions(false)
    },
  })

  // FIXME move to a separate hook and reuse?
  useEffect(() => {
    if (!isModalOpened) return
    if (isPopup && pendingReqId) {
      // wait for SW to start
      swicWaitStarted().then(async () => {
        // block until req is loaded or we're sure it doesn't exist
        await swicCall('checkPendingRequest', npub, appNpub, pendingReqId)
        setIsLoaded(true)
      })
    } else {
      setIsLoaded(true)
    }
  }, [isModalOpened, isPopup, npub, appNpub, pendingReqId])

  useEffect(() => {
    return () => {
      if (isModalOpened) {
        // modal closed
        setShowAdvancedOptions(false)
      }
    }
  }, [isModalOpened])
  if (isLoaded) {
    const isNpubExists = npub.trim().length && keys.some((key) => key.npub === npub)
    // NOTE: app doesn't exist yet!
    // const isAppNpubExists = appNpub.trim().length && apps.some((app) => app.appNpub === appNpub)
    const isPendingReqIdExists = pendingReqId.trim().length && pending.some((p) => p.id === pendingReqId)
    // console.log("pending", {isModalOpened, isPendingReqIdExists, isNpubExists, /*isAppNpubExists,*/ pendingReqId, pending});
    if (isModalOpened && (!isNpubExists /*|| !isAppNpubExists*/ || (pendingReqId && !isPendingReqIdExists))) {
      // we are looking at a stale event!
      if (!isPopup) closeModalAfterRequest()
      return null
    }
  }

  const handleActionTypeChange = (_: any, value: ACTION_TYPE | null) => {
    if (!value) return undefined
    return setSelectedActionType(value)
  }

  const handleChangeCheckbox = (reqId: string) => {
    const newRequestedPerms = perms.map((req) => {
      if (req.id === reqId) return { ...req, checked: !req.checked }
      return req
    })
    setPerms(newRequestedPerms)
  }

  const closePopup = (result?: string) => {
    if (!isPopup) return
    if (!redirectUri) return window.close()

    // add done marker first
    searchParams.append('done', 'true')
    setSearchParams(searchParams)

    // and then do the redirect
    const url = `${redirectUri}${redirectUri.includes('?') ? '&' : '?'}result=${encodeURIComponent(result || '')}`
    window.location.href = url
  }

  async function confirmPending(id: string, allow: boolean, remember: boolean, options?: any) {
    try {
      const result = await swicCall('confirm', id, allow, remember, options)
      console.log('confirmed', { id, allow, remember, options, result })
      if (!isPopup) closeModalAfterRequest()
      closePopup(result as string)
    } catch (e) {
      console.log(`Error: ${e}`)
      notify('Error: ' + e, 'error')
    }
  }

  const allow = async () => {
    let allowedPerms = ['connect', 'get_public_key']
    allowedPerms.push(...perms.filter((p) => p.checked).map((p) => p.perm))

    if (pendingReqId) {
      const options = { perms: allowedPerms, appUrl }
      await confirmPending(pendingReqId, true, true, options)
    } else {
      try {
        await askNotificationPermission()
        const result = await swicCall('enablePush')
        if (!result) throw new Error('Failed to activate the push subscription')
        console.log('enablePush done')
      } catch (e: any) {
        console.log('error', e)
        notify('Please enable Notifications in website settings!', 'error')
        // keep going
      }

      try {
        await swicCall('connectApp', { npub, appNpub, appUrl, perms: allowedPerms })
        console.log('connectApp done', npub, appNpub, appUrl, allowedPerms)
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

      const { data: pubkey } = nip19.decode(npub)
      if (isPopup) setTimeout(() => closePopup(pubkey as string), 3000)
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
        // FIXME it should be 'ignore once',
        // not 'disallow & remember' - this is too strict
        // disallow()
      }
    })
  }

  const handleUnselectPerms = () => {
    setPerms((prevPerms) => prevPerms.map((rp) => ({ ...rp, checked: false })))
  }

  const handleSelectPerms = () => {
    setPerms((prevPerms) => prevPerms.map((rp) => ({ ...rp, checked: true })))
  }

  const permsTitle = hasReqPerms ? `Requested ${perms.length} permissions` : 'Basic permissions'
  const permsDescription = hasReqPerms
    ? formatPermSummary(perms.map(p => p.perm))
    : 'The default set of permissions for social media apps'

  return (
    <Modal title="Connection request" open={isModalOpened} withCloseButton={false}>
      <Stack gap={'1rem'} paddingTop={'1rem'}>
        {done && (
          <Typography variant="body1" color={'GrayText'}>
            Redirecting back to your app...
          </Typography>
        )}
        {!done && !pendingReqId && (
          <Typography variant="body1" color={'GrayText'}>
            You will be asked to <b>enable notifications</b>, this is needed for a reliable communication with Nostr
            apps.
          </Typography>
        )}

        <Stack direction={'row'} gap={'1rem'} alignItems={'center'} marginBottom={'1rem'}>
          <IconApp picture={appIcon} alt={appAvatarTitle} getAppTitle={() => appAvatarTitle} size="large" />
          <Box overflow={'auto'}>
            <Typography variant="h5" fontWeight={600} noWrap>
              {appName}
            </Typography>
            <Typography variant="body2" color={'GrayText'} noWrap>
              New app would like to connect
            </Typography>
          </Box>
        </Stack>

        <StyledToggleButtonsGroup value={selectedActionType} onChange={handleActionTypeChange} exclusive>
          <ActionToggleButton
            selected={true}
            value={hasReqPerms ? ACTION_TYPE.REQUESTED : ACTION_TYPE.BASIC}
            title={permsTitle}
            description={permsDescription}
            onClick={() => setShowAdvancedOptions(true)}
          />
        </StyledToggleButtonsGroup>

        <Stack gap={'0.5rem'}>
          {showAdvancedOptions && (
            <StyledActionsListContainer marginBottom={'0.5rem'}>
              <SectionTitle>Permissions</SectionTitle>
              <RequestedPermissions requestedPerms={perms} onChangeCheckbox={handleChangeCheckbox} />
              <Stack direction={'row'} gap={'1rem'}>
                <StyledSelectButton onClick={handleSelectPerms}>Select all</StyledSelectButton>
                <StyledSelectButton onClick={handleUnselectPerms}>Clear all</StyledSelectButton>
              </Stack>
            </StyledActionsListContainer>
          )}
        </Stack>

        <Stack direction={'row'} gap={'1rem'}>
          <StyledButton onClick={disallow} varianttype="secondary">
            Ignore
          </StyledButton>
          <StyledButton fullWidth onClick={allow}>
            Connect
          </StyledButton>
        </Stack>
      </Stack>
    </Modal>
  )
}
