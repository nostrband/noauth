import { useParams } from 'react-router'
import { useAppSelector } from '@/store/hooks/redux'
import { selectAppByAppNpub, selectKeys, selectPermsByNpubAndAppNpub } from '@/store'
import { Navigate, useNavigate } from 'react-router-dom'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { getAppDevice, getAppIconTitle, getDomainPort } from '@/utils/helpers/helpers'
import { Button } from '@/shared/Button/Button'
import { Permissions } from './components/Permissions/Permissions'
import { useToggleConfirm } from '@/hooks/useToggleConfirm'
import { ConfirmModal } from '@/shared/ConfirmModal/ConfirmModal'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { IOSBackButton } from '@/shared/IOSBackButton/IOSBackButton'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import MoreIcon from '@mui/icons-material/MoreVertRounded'
import { ModalAppDetails } from '@/components/Modal/ModalAppDetails/ModalAppDetails'
import { IconApp } from '@/shared/IconApp/IconApp'
import { HeadingContainer, AppInfoContainer, AppNameContainer } from './styled'
import { formatDistanceToNow } from 'date-fns'
import { ModalAddPermission } from '@/components/Modal/ModalAddPermission/ModalAddPermission'
import { ModalActivities } from '@/components/Modal/ModalActivities/ModalActivities'
import { useProfile } from '@/hooks/useProfile'
import { DeviceInfo } from '@/components/DeviceInfo/DeviceInfo'
import { getShortenNpub } from '@/modules/common/helpers'
import { client } from '@/modules/swic'

const AppPage = () => {
  const keys = useAppSelector(selectKeys)

  const { appNpub = '', npub = '' } = useParams()
  const currentApp = useAppSelector((state) => selectAppByAppNpub(state, appNpub))
  const perms = useAppSelector((state) => selectPermsByNpubAndAppNpub(state, npub, appNpub))
  const sortedPerms = perms.sort((a, b) => (new Date(a.timestamp) < new Date(b.timestamp) ? 1 : -1))

  const navigate = useNavigate()
  const notify = useEnqueueSnackbar()
  const { open, handleClose, handleShow } = useToggleConfirm()
  const { handleOpen: handleOpenModal } = useModalSearchParams()

  const isNpubExists = npub.trim().length && keys.some((key) => key.npub === npub)

  const { icon = '', name = '', url = '', userAgent = '', subNpub } = currentApp || {}
  const appDomain = getDomainPort(url)
  const shortAppNpub = getShortenNpub(appNpub)
  const appName = name || appDomain || shortAppNpub
  const appIcon = icon
  const appAvatarTitle = getAppIconTitle(name || appDomain, appNpub)
  const appDevice = getAppDevice(userAgent)
  const subNpubExists = !!subNpub
  const { userAvatar, userName } = useProfile(subNpub || '')
  const subNpubName = userName || getShortenNpub(subNpub)

  const handleDeleteApp = async () => {
    try {
      await client.deleteApp(appNpub, npub)
      notify(`App: «${appName}» successfully deleted!`, 'success')
      navigate(`/key/${npub}`)
    } catch (error: any) {
      notify(error?.message || 'Failed to delete app', 'error')
    }
  }

  const handleShowAppDetailsModal = () => handleOpenModal(MODAL_PARAMS_KEYS.APP_DETAILS)

  if (!isNpubExists || !currentApp) {
    return <Navigate to={`/key/${npub}`} />
  }

  const connectDate = formatDistanceToNow(new Date(currentApp.timestamp), {
    addSuffix: true,
  })
  const connectedOn = `Connected ${connectDate}`

  return (
    <>
      <Stack maxHeight={'100%'} overflow={'auto'} alignItems={'flex-start'} height={'100%'}>
        <IOSBackButton onNavigate={() => navigate(`key/${npub}`)} />

        <HeadingContainer>
          <IconApp size="big" domain={appDomain} picture={appIcon} alt={appAvatarTitle} />
          <Box flex={'1'} overflow={'auto'} alignSelf={'flex-start'} width={'100%'}>
            <AppInfoContainer>
              <AppNameContainer>
                <Typography className="app_name" variant="h4" noWrap>
                  {appName}
                </Typography>
              </AppNameContainer>

              <IconButton onClick={handleShowAppDetailsModal}>
                <MoreIcon />
              </IconButton>
            </AppInfoContainer>

            <Typography variant="body2" noWrap>
              {connectedOn}
            </Typography>

            {appDevice && <DeviceInfo info={appDevice} />}
          </Box>
        </HeadingContainer>

        {subNpubExists && (
          <Box marginBottom={'1rem'}>
            <SectionTitle marginBottom={'0.5rem'}>Shared with</SectionTitle>
            <Stack direction={'row'} gap={'1rem'} alignItems={'center'}>
              <IconApp picture={userAvatar} alt={subNpubName} size="large" isRounded />
              <Typography noWrap fontWeight={500}>
                {subNpubName}
              </Typography>
            </Stack>
          </Box>
        )}

        <Box marginBottom={'1rem'}>
          <SectionTitle marginBottom={'0.5rem'}>Disconnect</SectionTitle>
          <Button fullWidth onClick={handleShow}>
            Delete app
          </Button>
        </Box>

        <Permissions perms={sortedPerms} />

        <Stack direction={'row'} alignItems={'center'} gap={'1rem'} width={'100%'}>
          <Button fullWidth onClick={() => handleOpenModal(MODAL_PARAMS_KEYS.ADD_PERMISSION)}>
            Add permission
          </Button>
          <Button fullWidth onClick={() => handleOpenModal(MODAL_PARAMS_KEYS.ACTIVITY)}>
            Activity
          </Button>
        </Stack>
      </Stack>

      <ConfirmModal
        open={open}
        headingText="Delete app"
        description="Are you sure you want to delete this app?"
        onCancel={handleClose}
        onConfirm={handleDeleteApp}
        onClose={handleClose}
      />

      <ModalActivities appNpub={appNpub} />
      <ModalAppDetails />
      <ModalAddPermission />
    </>
  )
}

export default AppPage
