import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { getAppIconTitle, getDomainPort, getReqActionName, getShortenNpub } from '@/utils/helpers/helpers'
import { Box, FormControlLabel, Stack, Typography } from '@mui/material'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks/redux'
import { selectAppsByNpub, selectPendingsByNpub } from '@/store'
import { FC, useEffect, useState } from 'react'
import {
  Container,
  StyledActionName,
  StyledAvatar,
  StyledButton,
  StyledHeadingContainer,
  StyledPre,
} from './styled'
import { swicCall, swicWaitStarted } from '@/modules/swic'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { AppLink } from '@/shared/AppLink/AppLink'
import { getReqDetails } from '@/utils/helpers/helpers-frontend'
import { Checkbox } from '@/shared/Checkbox/Checkbox'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'

enum ACTION_TYPE {
  ALWAYS = 'ALWAYS',
  ONCE = 'ONCE',
}

const ACTION_LABELS = {
  [ACTION_TYPE.ALWAYS]: 'Always',
  [ACTION_TYPE.ONCE]: 'Once',
}

export const ModalConfirmEvent: FC = () => {
  const notify = useEnqueueSnackbar()

  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONFIRM_EVENT)
  const [searchParams, setSearchParams] = useSearchParams()

  const pendingReqId = searchParams.get('reqId') || ''
  const isPopup = searchParams.get('popup') === 'true'
  const redirectUri = searchParams.get('redirect_uri') || ''
  const done = searchParams.get('done') === 'true'

  const { npub = '' } = useParams<{ npub: string }>()
  const apps = useAppSelector((state) => selectAppsByNpub(state, npub))
  const pendings = useAppSelector((state) => selectPendingsByNpub(state, npub))

  const currentPendingRequest = pendings.find((pr) => pr.id === pendingReqId)
  const appNpub = currentPendingRequest?.appNpub || ''

  const [isLoaded, setIsLoaded] = useState(false)
  const [remember, setRemember] = useState(true)

  const [showDetails, setShowDetails] = useState(false)
  const [details, setDetails] = useState('')

  const [isPending, setIsPending] = useState(false)

  const closeModalAfterRequest = createHandleCloseReplace(MODAL_PARAMS_KEYS.CONFIRM_EVENT, {
    onClose: (sp) => {
      sp.delete('appNpub')
      sp.delete('reqId')
      sp.delete('redirect_uri')
      sp.delete('popup')
      setRemember(true)
      setShowDetails(false)
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

  useEffect(() => {
    // reset
    setShowDetails(false)
    setRemember(true)
    setIsPending(false)

    if (!isModalOpened) return
    if (isPopup && pendingReqId) {
      // wait for SW to start
      swicWaitStarted().then(async () => {
        await swicCall('checkPendingRequest', npub, pendingReqId)
        setIsLoaded(true)
      })
    } else {
      setIsLoaded(true)
    }
  }, [isModalOpened, isPopup, pendingReqId, appNpub, npub])

  useEffect(() => {
    const load = async () => {
      if (currentPendingRequest) setDetails(await getReqDetails(currentPendingRequest))
      else setDetails('')
    }
    load()
  }, [currentPendingRequest])

  if (isLoaded && isModalOpened && !currentPendingRequest) {
    if (!isPopup) closeModalAfterRequest()
    return null
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

  async function confirmPending(allow: boolean) {
    if (!currentPendingRequest) return
    setIsPending(true)
    try {
      const result = await swicCall('confirm', currentPendingRequest.id, allow, remember)
      console.log('confirmed', { id: currentPendingRequest.id, remember, allow, result })
      setIsPending(false)
    } catch (e) {
      console.log(`Error: ${e}`)
      notify('Error: ' + e, 'error')
      setIsPending(false)
      return
    }
    if (!isPopup) closeModalAfterRequest()
    closePopup()
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

  const handleToggleShowJsonParams = () => setShowDetails((prevState) => !prevState)

  const handleChangeRememberDecision = (e: any, checked: boolean) => setRemember(checked)

  const actionLabel = remember ? ACTION_LABELS.ALWAYS : ACTION_LABELS.ONCE

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
            {details && <AppLink title="Details" onClick={handleToggleShowJsonParams} />}
          </Box>
          {showDetails && <StyledPre>{details}</StyledPre>}
          <Box padding={'0.5rem 0.5rem 0 0.5rem'}>
            <FormControlLabel
              onChange={handleChangeRememberDecision}
              checked={remember}
              control={<Checkbox />}
              label="Remember my decision"
              sx={{ marginLeft: 0 }}
            />
          </Box>
        </Stack>

        <Stack direction={'row'} gap={'1rem'} justifyContent={'flex-end'}>
          <StyledButton onClick={() => confirmPending(false)} varianttype="secondary" disabled={isPending}>
            Disallow {actionLabel} {isPending && <LoadingSpinner mode="secondary" />}
          </StyledButton>
          <StyledButton onClick={() => confirmPending(true)} disabled={isPending}>
            Allow {actionLabel} {isPending && <LoadingSpinner />}
          </StyledButton>
        </Stack>
      </Container>
    </Modal>
  )
}
