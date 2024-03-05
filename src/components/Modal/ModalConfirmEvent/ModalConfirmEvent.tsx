import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { getAppIconTitle, getDomain, getReqActionName, getShortenNpub } from '@/utils/helpers/helpers'
import { Avatar, Box, List, ListItem, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks/redux'
import { selectAppsByNpub, selectKeys } from '@/store'
import { ActionToggleButton } from './сomponents/ActionToggleButton'
import { FC, useEffect, useMemo, useState } from 'react'
import { StyledActionsListContainer, StyledButton, StyledToggleButtonsGroup } from './styled'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { swicCall, swicWaitStarted } from '@/modules/swic'
import { Checkbox } from '@/shared/Checkbox/Checkbox'
import { DbPending } from '@/modules/db'
import { IPendingsByAppNpub } from '@/pages/KeyPage/hooks/useTriggerConfirmModal'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'

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

type ModalConfirmEventProps = {
  confirmEventReqs: IPendingsByAppNpub
}

type PendingRequest = DbPending & { checked: boolean }

export const ModalConfirmEvent: FC<ModalConfirmEventProps> = ({ confirmEventReqs }) => {
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

  const [selectedActionType, setSelectedActionType] = useState<ACTION_TYPE>(ACTION_TYPE.ALWAYS)
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const currentAppPendingReqs = useMemo(() => confirmEventReqs[appNpub]?.pending || [], [confirmEventReqs, appNpub])

  useEffect(() => {
    setPendingRequests(currentAppPendingReqs.map((pr) => ({ ...pr, checked: true })))
  }, [currentAppPendingReqs])

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
  const appDomain = getDomain(url)
  const shortAppNpub = getShortenNpub(appNpub)
  const appName = name || appDomain || shortAppNpub
  const appIcon = icon || `https://${appDomain}/favicon.ico`
  const appAvatarTitle = getAppIconTitle(name || appDomain, appNpub)
  const isAppNameExists = !!name || !!appDomain
  const redirectUri = searchParams.get('redirect_uri') || ''
  const done = searchParams.get('done') === 'true'

  useEffect(() => {
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

  if (isLoaded) {
    const isNpubExists = npub.trim().length && keys.some((key) => key.npub === npub)
    const isAppNpubExists = appNpub.trim().length && apps.some((app) => app.appNpub === appNpub)
    // console.log("confirm event", { confirmEventReqs, isModalOpened, isNpubExists, isAppNpubExists });
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

  const selectedPendingRequests = pendingRequests.filter((pr) => pr.checked)

  async function confirmPending(allow: boolean) {
    for (const req of selectedPendingRequests) {
      try {
        const remember = selectedActionType !== ACTION_TYPE.ONCE
        const result = await swicCall('confirm', req.id, allow, remember)
        console.log('confirmed', { id: req.id, selectedActionType, allow, result })
      } catch (e) {
        console.log(`Error: ${e}`)
        notify('Error: '+e, 'error')
        return
      }
    }
    if (!isPopup) closeModalAfterRequest()
    closePopup()
  }

  const closePopup = () => {
    console.log("closePopup", { isPopup, redirectUri })
    if (!isPopup) return
    if (!redirectUri) return window.close()

    // add done marker first
    searchParams.append('done', 'true')
    setSearchParams(searchParams)

    // and then do the redirect
    window.location.href = redirectUri
  }

  const handleChangeCheckbox = (reqId: string) => () => {
    const newPendingRequests = pendingRequests.map((req) => {
      if (req.id === reqId) return { ...req, checked: !req.checked }
      return req
    })
    setPendingRequests(newPendingRequests)
  }

  if (isPopup) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // FIXME it should be 'ignore once',
        // confirmPending(false)
      }
    })
  }

  return (
    <Modal title="Permission request" open={isModalOpened} withCloseButton={false}>
      <Stack gap={'1rem'} paddingTop={'1rem'}>
        {done && (
          <Typography variant="body1" color={'GrayText'}>
            Redirecting back to your app...
          </Typography>
        )}
        <Stack direction={'row'} gap={'1rem'} alignItems={'center'} marginBottom={'1rem'}>
          <Avatar
            variant="square"
            sx={{
              width: 56,
              height: 56,
              borderRadius: '12px',
            }}
            src={appIcon}
          >
            {appAvatarTitle}
          </Avatar>
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
              App wants to perform these actions
            </Typography>
          </Box>
        </Stack>

        <StyledActionsListContainer marginBottom={'1rem'}>
          <SectionTitle>Actions</SectionTitle>
          <List>
            {pendingRequests.map((req) => {
              return (
                <ListItem key={req.id}>
                  <ListItemIcon>
                    <Checkbox checked={req.checked} onChange={handleChangeCheckbox(req.id)} />
                  </ListItemIcon>
                  <ListItemText>{getReqActionName(req)}</ListItemText>
                </ListItem>
              )
            })}
          </List>
        </StyledActionsListContainer>
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
      </Stack>
    </Modal>
  )
}
