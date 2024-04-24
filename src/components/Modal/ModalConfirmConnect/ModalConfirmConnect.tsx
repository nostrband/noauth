import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import {
  askNotificationPermission,
  formatPermSummary,
  getAppIconTitle,
  getDomainPort,
  getReferrerAppUrl,
  getReqParams,
  getShortenNpub,
  packageToPerms,
  permListToPerms,
} from '@/utils/helpers/helpers'
import { Box, Stack, Typography } from '@mui/material'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks/redux'
import { selectAppsByNpub, selectPendingsByNpub } from '@/store'
import { StyledActionsListContainer, StyledButton, StyledSelectButton, StyledToggleButtonsGroup } from './styled'
import { ActionToggleButton } from './сomponents/ActionToggleButton'
import { useCallback, useEffect, useState } from 'react'
import { swicCall, swicWaitStarted } from '@/modules/swic'
import { ACTION_TYPE } from '@/utils/consts'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { nip19 } from 'nostr-tools'
import { IconApp } from '@/shared/IconApp/IconApp'
import { RequestedPermissions } from './сomponents/RequestedPermissions/RequestedPermissions'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { useProfile } from '@/hooks/useProfile'
import { usePrepareExistingAppPerms } from './hooks/usePrepareExistingAppPerms'
import { Perm } from './types'
import { convertPermListToOptions } from './helpers'

export const ModalConfirmConnect = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const notify = useEnqueueSnackbar()
  const navigate = useNavigate()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONFIRM_CONNECT)
  const [searchParams, setSearchParams] = useSearchParams()

  const [isLoaded, setIsLoaded] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [selectedPerms, setSelectedPerms] = useState<Perm[]>([])
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  // npub might be passed by the /create page
  const { npub = searchParams.get('npub') || '' } = useParams<{ npub: string }>()

  // apps for this npub
  const apps = useAppSelector((state) => selectAppsByNpub(state, npub))
  // pending reqs for this npub
  const pending = useAppSelector((state) => selectPendingsByNpub(state, npub))

  // we need valid reqId
  const pendingReqId = searchParams.get('reqId') || ''
  const req = pending.find((p) => p.id === pendingReqId)

  // provided by apps
  const redirectUri = searchParams.get('redirect_uri') || ''

  // to show 'redirecting back to your app'
  const done = searchParams.get('done') === 'true'

  // popup mode for auth_url
  const isPopup = searchParams.get('popup') === 'true'

  // server token for create_account callback
  const token = searchParams.get('token') || ''

  // to show subNpub profile
  const { subNpub = '', appNpub = '' } = req || {}
  const { userAvatar, userName } = useProfile(subNpub)
  const subNpubName = userName || getShortenNpub(subNpub)

  const triggerApp = apps.find((app) => app.appNpub === appNpub)

  const { name = '', url = '', icon = '' } = triggerApp || {}
  const appUrl = url || getReferrerAppUrl()
  const appDomain = getDomainPort(appUrl)
  const appName = name || appDomain || getShortenNpub(appNpub)
  const appAvatarTitle = getAppIconTitle(name || appDomain, appNpub)
  const appIcon = icon

  // existing perms for this appDomain
  const appDomainPerms = usePrepareExistingAppPerms(npub, appDomain, apps)
  const appDomainPermsExists = appDomainPerms.length > 0

  // perms requested by 'connect'/'create_account'
  const params = req ? getReqParams(req) : []
  const permsParam = params?.[2] || ''
  const hasReqPerms = !!permsParam
  const actionTypeDependingOnHasReqPerms = hasReqPerms ? ACTION_TYPE.REQUESTED : ACTION_TYPE.BASIC

  const [selectedActionType, setSelectedActionType] = useState<ACTION_TYPE>(
    appDomainPermsExists ? ACTION_TYPE.REUSE : actionTypeDependingOnHasReqPerms
  )

  const getPermOptions = useCallback(
    (type: ACTION_TYPE) => {
      if (type === ACTION_TYPE.BASIC) {
        return convertPermListToOptions(packageToPerms(ACTION_TYPE.BASIC) || [], npub, appNpub)
      }
      if (type === ACTION_TYPE.REQUESTED) {
        return convertPermListToOptions(permListToPerms(permsParam), npub, appNpub)
      }
      return []
    },
    [appNpub, npub, permsParam]
  )

  useEffect(() => {
    setSelectedActionType(appDomainPermsExists ? ACTION_TYPE.REUSE : actionTypeDependingOnHasReqPerms)
    // eslint-disable-next-line
  }, [isLoaded])

  useEffect(() => {
    if (selectedActionType === ACTION_TYPE.REUSE) {
      return setSelectedPerms(appDomainPerms.map((p) => ({ ...p, checked: true })))
    }
    if (selectedActionType === ACTION_TYPE.REQUESTED) {
      return setSelectedPerms(getPermOptions(ACTION_TYPE.REQUESTED))
    }
    return setSelectedPerms(getPermOptions(ACTION_TYPE.BASIC))
    // eslint-disable-next-line
  }, [selectedActionType])

  const closeModalAfterRequest = createHandleCloseReplace(MODAL_PARAMS_KEYS.CONFIRM_CONNECT, {
    onClose: (sp) => {
      sp.delete('reqId')
      sp.delete('popup')
      sp.delete('token')
      sp.delete('redirect_uri')
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
        await swicCall('checkPendingRequest', npub, pendingReqId)
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
        setIsPending(false)
      }
    }
  }, [isModalOpened])

  if (isLoaded) {
    if (isModalOpened && !req) {
      // we are looking at a stale event!
      if (!isPopup) closeModalAfterRequest()
      return null
    }
  }

  const handleActionTypeChange = (_: any, value: ACTION_TYPE | null) => {
    if (!value) {
      setShowAdvancedOptions((prevShow) => !prevShow)
      return
    }
    setShowAdvancedOptions(true)
    setSelectedActionType(value)
  }

  const handleChangeCheckbox = (reqId: string) => {
    const newRequestedPerms = selectedPerms.map((req) => {
      if (req.id === reqId) return { ...req, checked: !req.checked }
      return req
    })
    setSelectedPerms(newRequestedPerms)
  }

  const closePopup = (result?: string) => {
    if (!isPopup) return
    if (!redirectUri) return window.close()

    setIsPending(false)
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
    allowedPerms.push(...selectedPerms.filter((p) => p.checked).map((p) => p.perm))

    if (pendingReqId) {
      const options = { perms: allowedPerms, appUrl }
      setIsPending(true)
      await confirmPending(pendingReqId, true, true, options).finally(() => setIsPending(false))
    } else {
      setIsPending(true)
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
        setIsPending(false)
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
          setIsPending(false)
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
    if (pendingReqId) {
      setIsPending(true)
      confirmPending(pendingReqId, false, true).finally(() => setIsPending(false))
    } else {
      closeModalAfterRequest()
    }
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
    setSelectedPerms((prevPerms) => prevPerms.map((rp) => ({ ...rp, checked: false })))
  }

  const handleSelectPerms = () => {
    setSelectedPerms((prevPerms) => prevPerms.map((rp) => ({ ...rp, checked: true })))
  }

  const reuseActionTypePerms = selectedActionType === ACTION_TYPE.REUSE ? selectedPerms : appDomainPerms
  const reuseActionTypeDescription = formatPermSummary(reuseActionTypePerms.map((p) => p.perm))

  const requestedActionTypePerms =
    selectedActionType === ACTION_TYPE.REQUESTED ? selectedPerms : getPermOptions(ACTION_TYPE.REQUESTED)
  const requestedActionTypeDescription = formatPermSummary(requestedActionTypePerms.map((p) => p.perm))

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
          <IconApp
            picture={appIcon}
            domain={appDomain}
            alt={appAvatarTitle}
            getAppTitle={() => appAvatarTitle}
            size="large"
          />
          <Box overflow={'auto'}>
            <Typography variant="h5" fontWeight={600} noWrap>
              {appName}
            </Typography>
            <Typography variant="body2" color={'GrayText'} noWrap>
              New app would like to connect
            </Typography>
          </Box>
        </Stack>

        {subNpub.trim().length > 0 && (
          <Stack gap={'0.5rem'} marginBottom={'1rem'}>
            <SectionTitle>Shared access with</SectionTitle>
            <Stack direction={'row'} alignItems={'center'} gap={'0.5rem'}>
              <IconApp picture={userAvatar} alt={subNpubName} size="medium" isRounded />
              <Box overflow={'auto'}>
                <Typography>{subNpubName}</Typography>
                <Typography variant="body2" color={'GrayText'}>
                  {getShortenNpub(subNpub)}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        )}

        <SectionTitle>Permissions</SectionTitle>
        <StyledToggleButtonsGroup value={selectedActionType} onChange={handleActionTypeChange} exclusive>
          {appDomainPermsExists && (
            <ActionToggleButton
              value={ACTION_TYPE.REUSE}
              title={'Reuse permissions'}
              description={reuseActionTypeDescription}
            />
          )}
          {!hasReqPerms && (
            <ActionToggleButton
              value={ACTION_TYPE.BASIC}
              title={'Basic permissions'}
              description={'The default set of permissions for social media apps'}
            />
          )}
          {hasReqPerms && (
            <ActionToggleButton
              value={ACTION_TYPE.REQUESTED}
              title={`Asking ${selectedPerms.length} permissions`}
              description={requestedActionTypeDescription}
            />
          )}
        </StyledToggleButtonsGroup>

        <Stack gap={'0.5rem'}>
          {showAdvancedOptions && (
            <StyledActionsListContainer marginBottom={'0.5rem'}>
              <SectionTitle>Permissions</SectionTitle>
              <RequestedPermissions requestedPerms={selectedPerms} onChangeCheckbox={handleChangeCheckbox} />
              <Stack direction={'row'} gap={'1rem'}>
                <StyledSelectButton onClick={handleSelectPerms}>Select all</StyledSelectButton>
                <StyledSelectButton onClick={handleUnselectPerms}>Clear all</StyledSelectButton>
              </Stack>
            </StyledActionsListContainer>
          )}
        </Stack>

        <Stack direction={'row'} gap={'1rem'}>
          <StyledButton onClick={disallow} varianttype="secondary">
            Ignore {isPending && <LoadingSpinner mode="secondary" />}
          </StyledButton>
          <StyledButton fullWidth onClick={allow}>
            Connect {isPending && <LoadingSpinner />}
          </StyledButton>
        </Stack>
      </Stack>
    </Modal>
  )
}
