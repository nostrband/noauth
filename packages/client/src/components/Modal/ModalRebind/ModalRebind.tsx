import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { getAppIconTitle, getDomainPort, parseRebindToken } from '@/utils/helpers/helpers'
import { Box, Stack, Typography } from '@mui/material'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks/redux'
import { selectAppsByNpub } from '@/store'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { IconApp } from '@/shared/IconApp/IconApp'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { getShortenNpub } from '@noauth/common'
import { client } from '@/modules/client'
import useIframePort from '@/hooks/useIframePort'

export const ModalRebind = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const notify = useEnqueueSnackbar()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.REBIND)
  const [searchParams, setSearchParams] = useSearchParams()

  const token = searchParams.get('token') || ''
  const { npub: tokenNpub, appNpub } = useMemo(() => parseRebindToken(token), [token])
  const [state, setState] = useState<'' | 'confirming' | 'done' | 'error'>('')
  const done = state === 'done' || searchParams.get('done') === 'true'

  // popup mode always
  const isPopup = false; // FIXME DEBUG searchParams.get('popup') === 'true'

  // add later
  const redirectUri = ''

  // a port to talk to our iframe embedded by the app
  // so that we could pass this connection (nsec+appNpub) to
  // the iframe so it would save it to it's partitioned storage
  const { port } = useIframePort(isPopup)
  console.log('iframe port', port)

  // npub might be passed by the /create page
  const { npub = '' } = useParams<{ npub: string }>()

  // apps for this npub
  const apps = useAppSelector((state) => selectAppsByNpub(state, npub))

  const triggerApp = apps.find((app) => app.appNpub === appNpub)

  const { name = '', url = '', icon = '' } = triggerApp || {}
  const appUrl = url
  const appDomain = getDomainPort(appUrl)
  const appName = name || appDomain || getShortenNpub(appNpub) || ''
  const appAvatarTitle = appNpub ? getAppIconTitle(name || appDomain, appNpub) : ''
  const appIcon = icon

  const closeModalAfterRequest = createHandleCloseReplace(MODAL_PARAMS_KEYS.CONFIRM_CONNECT, {
    onClose: (sp) => {
      sp.delete('token')
      sp.delete('redirect_uri')
    },
  })

  const closePopup = useCallback(
    (result?: string) => {
      if (!isPopup) return

      notify('App connected! Closing...', 'success')

      if (redirectUri) {
        // add done marker first
        searchParams.append('done', 'true')
        setSearchParams(searchParams)
      }

      setTimeout(() => {
        if (!redirectUri) return window.close()
        // do the redirect
        // @ts-ignore
        const url = `${redirectUri}${redirectUri.includes('?') ? '&' : '?'}result=${encodeURIComponent(result || '')}`
        window.location.href = url
      }, 2000)
    },
    [setSearchParams, notify, redirectUri, isPopup, searchParams]
  )

  const confirm = useCallback(async () => {
    if (state) return
    try {
      setState('confirming')
      await client.rebind(npub, appNpub!, port!)
      setState('done')
      console.log('rebound', { npub, appNpub, port, isPopup })
      closeModalAfterRequest()
      if (isPopup) closePopup()
    } catch (e) {
      console.log(`Error: ${e}`)
      setState('error')
      notify('Error: ' + e, 'error')
    }
  }, [npub, appNpub, port, state, setState, closeModalAfterRequest, closePopup, isPopup, notify])

  useEffect(() => {
    if (!npub || !appNpub || !port || npub !== tokenNpub) return
    confirm()
  }, [npub, appNpub, port, confirm, tokenNpub])

  if (isModalOpened && (npub !== tokenNpub || !triggerApp)) {
    // app not found, FIXME should we create a fake 'connect' request?
    if (!isPopup) closeModalAfterRequest()
    return null
  }

  return (
    <Modal title="Re-connecting" open={isModalOpened} withCloseButton={false}>
      <Stack gap={'1rem'} paddingTop={'1rem'}>
        {done && (
          <Typography variant="body1" color={'GrayText'}>
            Redirecting back to your app...
          </Typography>
        )}
        {!done && (
          <Typography variant="body1" color={'GrayText'}>
            Reconnecting the app to your keys.
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
              Existing app would like to reconnect
            </Typography>
          </Box>
        </Stack>

        {/* {subNpub.trim().length > 0 && (
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
 */}
        {/* <SectionTitle>Permissions</SectionTitle>
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
              title={`Asking ${reqPermCount} permissions`}
              description={requestedActionTypeDescription}
            />
          )}
        </StyledToggleButtonsGroup> */}

        {/* <Stack direction={'row'} gap={'1rem'}>
          <StyledButton onClick={disallow} varianttype="secondary">
            Ignore {isPending && <LoadingSpinner mode="secondary" />}
          </StyledButton>
          <StyledButton fullWidth onClick={allow}>
            Connect {isPending && <LoadingSpinner />}
          </StyledButton>
        </Stack> */}
        {!done && <LoadingSpinner mode="secondary" size={'2rem'} />}
        {state === 'error' && (
          <Typography variant="body1" color={'red'}>
            Failed to rebind, please try again
          </Typography>
        )}
      </Stack>
    </Modal>
  )
}
