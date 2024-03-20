import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { getAppIconTitle, getDomainPort, getReqActionName, getShortenNpub } from '@/utils/helpers/helpers'
import { Box, Stack, Typography } from '@mui/material'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks/redux'
import { selectAppsByNpub, selectKeys, selectPendingsByNpub } from '@/store'
import { ActionToggleButton } from './сomponents/ActionToggleButton'
import { FC, useEffect, useMemo, useState } from 'react'
import {
  Container,
  StyledActionName,
  StyledAvatar,
  StyledButton,
  StyledHeadingContainer,
  StyledPre,
  StyledToggleButtonsGroup,
} from './styled'
import { swicCall, swicWaitStarted } from '@/modules/swic'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { AppLink } from '@/shared/AppLink/AppLink'
import { getReqDetails } from '@/utils/helpers/helpers-frontend'

enum ACTION_TYPE {
  ALWAYS = 'ALWAYS',
  ONCE = 'ONCE',
  ALLOW_ALL = 'ALLOW_ALL',
}

const ACTION_LABELS = {
  [ACTION_TYPE.ALWAYS]: 'Always',
  [ACTION_TYPE.ONCE]: 'Just Once',
  [ACTION_TYPE.ALLOW_ALL]: 'All Advanced Actions',
}

export const ModalConfirmEvent: FC = () => {
  const keys = useAppSelector(selectKeys)
  const notify = useEnqueueSnackbar()

  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONFIRM_EVENT)
  const [searchParams, setSearchParams] = useSearchParams()

  const pendingReqId = searchParams.get('reqId') || ''
  const appNpub = searchParams.get('appNpub') || ''
  const isPopup = searchParams.get('popup') === 'true'
  const { npub = '' } = useParams<{ npub: string }>()
  const apps = useAppSelector((state) => selectAppsByNpub(state, npub))
  const pendings = useAppSelector((state) => selectPendingsByNpub(state, npub))

  const [selectedActionType, setSelectedActionType] = useState<ACTION_TYPE>(ACTION_TYPE.ALWAYS)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showJsonParams, setShowJsonParams] = useState(false)
  const [details, setDetails] = useState('')

  const currentAppPendingReqs = useMemo(
    () => pendings.filter((pr) => pr.appNpub === appNpub) || [],
    [pendings, appNpub]
  )

  const closeModalAfterRequest = createHandleCloseReplace(MODAL_PARAMS_KEYS.CONFIRM_EVENT, {
    onClose: (sp) => {
      sp.delete('appNpub')
      sp.delete('reqId')
      sp.delete('redirect_uri')
      sp.delete('popup')
    },
  })

  const triggerApp = apps.find((app) => app.appNpub === appNpub)
  const { name, url = '', icon = '' } = triggerApp || {}
  const appDomain = getDomainPort(url)
  const shortAppNpub = getShortenNpub(appNpub)
  const appName = name || appDomain || shortAppNpub
  const appIcon = icon || `https://${appDomain}/favicon.ico`
  const appAvatarTitle = getAppIconTitle(name || appDomain, appNpub)
  const isAppNameExists = !!name || !!appDomain
  const redirectUri = searchParams.get('redirect_uri') || ''
  const done = searchParams.get('done') === 'true'

  const currentPendingRequest = currentAppPendingReqs.find((pr) => pr.id === pendingReqId)

  useEffect(() => {
    // reset
    setShowJsonParams(false)
    if (!isModalOpened) return
    if (isPopup && pendingReqId) {
      // wait for SW to start
      swicWaitStarted().then(async () => {
        await swicCall('checkPendingRequest', npub, appNpub, pendingReqId)
        setIsLoaded(true)
      })
    } else {
      setIsLoaded(true)
    }
  }, [isModalOpened, isPopup, pendingReqId, appNpub, npub])

  useEffect(() => {
    const load = async () => {
      if (currentPendingRequest)
        setDetails(await getReqDetails(currentPendingRequest))
      else
        setDetails('')
    }
    load()
  }, [currentPendingRequest])

  if (isModalOpened && !currentPendingRequest) {
    closeModalAfterRequest()
    return null
  }

  if (isLoaded) {
    const isNpubExists = npub.trim().length && keys.some((key) => key.npub === npub)
    const isAppNpubExists = appNpub.trim().length && apps.some((app) => app.appNpub === appNpub)
    if (isModalOpened && (!currentAppPendingReqs.length || !isNpubExists || !isAppNpubExists)) {
      // if (isPopup) window.close()
      // else closeModalAfterRequest()
      if (!isPopup) closeModalAfterRequest()
      return null
    }
  }

  const handleActionTypeChange = (_: any, value: ACTION_TYPE | null) => {
    if (!value) return undefined
    return setSelectedActionType(value)
  }

  async function confirmPending(allow: boolean) {
    if (!currentPendingRequest) return
    try {
      const remember = selectedActionType !== ACTION_TYPE.ONCE
      const result = await swicCall('confirm', currentPendingRequest.id, allow, remember)
      console.log('confirmed', { id: currentPendingRequest.id, selectedActionType, allow, result })
    } catch (e) {
      console.log(`Error: ${e}`)
      notify('Error: ' + e, 'error')
      return
    }
    if (!isPopup) closeModalAfterRequest()
    closePopup()
  }

  const closePopup = () => {
    console.log('closePopup', { isPopup, redirectUri })
    if (!isPopup) return
    if (!redirectUri) return window.close()

    // add done marker first
    searchParams.append('done', 'true')
    setSearchParams(searchParams)

    // and then do the redirect
    window.location.href = redirectUri
  }

  if (isPopup) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // FIXME it should be 'ignore once',
        // confirmPending(false)
      }
    })
  }

  const actionName = currentPendingRequest ? getReqActionName(currentPendingRequest) : ''

  const handleToggleShowJsonParams = () => setShowJsonParams((prevState) => !prevState)

  return (
    <Modal title="Permission request" open={isModalOpened} withCloseButton={false}>
      <Container>
        {done && (
          <Typography variant="body1" color={'GrayText'}>
            Redirecting back to your app...
          </Typography>
        )}

        <StyledHeadingContainer>
          <StyledAvatar src={appIcon}>{appAvatarTitle}</StyledAvatar>
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {appName}
            </Typography>
            {isAppNameExists && (
              <Typography noWrap display={'block'} variant="body2" color={'GrayText'}>
                {shortAppNpub}
              </Typography>
            )}{' '}
            <Typography variant="body2" color={'GrayText'}>
              App wants to perform this action
            </Typography>
          </Box>
        </StyledHeadingContainer>

        <Stack gap={'0.5rem'}>
          <Box padding={'0.5rem'} display={'flex'} alignItems={'center'} gap={'0.5rem'}>
            <StyledActionName>{actionName}</StyledActionName>
            {details && <AppLink title="More info" onClick={handleToggleShowJsonParams} />}
          </Box>
          {showJsonParams && <StyledPre>{details}</StyledPre>}
        </Stack>

        <StyledToggleButtonsGroup value={selectedActionType} onChange={handleActionTypeChange} exclusive>
          <ActionToggleButton value={ACTION_TYPE.ALWAYS} title="Always" />
          <ActionToggleButton value={ACTION_TYPE.ONCE} title="Just once" />
        </StyledToggleButtonsGroup>

        <Stack direction={'row'} gap={'1rem'}>
          <StyledButton onClick={() => confirmPending(false)} varianttype="secondary">
            Disallow {ACTION_LABELS[selectedActionType]}
          </StyledButton>
          <StyledButton onClick={() => confirmPending(true)}>Allow {ACTION_LABELS[selectedActionType]}</StyledButton>
        </Stack>
      </Container>
    </Modal>
  )
}
