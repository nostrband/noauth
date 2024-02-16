import { useParams } from 'react-router'
import { useAppSelector } from '@/store/hooks/redux'
import { selectAppByAppNpub, selectKeys, selectPermsByNpubAndAppNpub } from '@/store'
import { Navigate, useNavigate } from 'react-router-dom'
import { formatTimestampDate } from '@/utils/helpers/date'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { getAppIconTitle, getDomain, getShortenNpub } from '@/utils/helpers/helpers'
import { Button } from '@/shared/Button/Button'
import { ACTION_TYPE } from '@/utils/consts'
import { Permissions } from './components/Permissions/Permissions'
import { StyledAppIcon } from './styled'
import { useToggleConfirm } from '@/hooks/useToggleConfirm'
import { ConfirmModal } from '@/shared/ConfirmModal/ConfirmModal'
import { swicCall } from '@/modules/swic'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { IOSBackButton } from '@/shared/IOSBackButton/IOSBackButton'
import { ModalActivities } from './components/Activities/ModalActivities'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import MoreIcon from '@mui/icons-material/MoreVertRounded'
import { ModalAppDetails } from '@/components/Modal/ModalAppDetails/ModalAppDetails'

const AppPage = () => {
  const keys = useAppSelector(selectKeys)

  const { appNpub = '', npub = '' } = useParams()
  const currentApp = useAppSelector((state) => selectAppByAppNpub(state, appNpub))
  const perms = useAppSelector((state) => selectPermsByNpubAndAppNpub(state, npub, appNpub))

  const navigate = useNavigate()
  const notify = useEnqueueSnackbar()
  const { open, handleClose, handleShow } = useToggleConfirm()
  const { handleOpen: handleOpenModal } = useModalSearchParams()

  const connectPerm = perms.find((perm) => perm.perm === 'connect' || perm.perm === ACTION_TYPE.BASIC)

  const isNpubExists = npub.trim().length && keys.some((key) => key.npub === npub)

  if (!isNpubExists || !currentApp) {
    return <Navigate to={`/key/${npub}`} />
  }

  const { icon = '', name = '', url = '' } = currentApp || {}
  const appDomain = getDomain(url)
  const shortAppNpub = getShortenNpub(appNpub)
  const appName = name || appDomain || shortAppNpub
  const appAvatarTitle = getAppIconTitle(name || appDomain, appNpub)
  const isAppNameExists = !!name

  const { timestamp } = connectPerm || {}
  const connectedOn = connectPerm && timestamp ? `Connected at ${formatTimestampDate(timestamp)}` : 'Not connected'

  const handleDeleteApp = async () => {
    try {
      await swicCall('deleteApp', appNpub)
      notify(`App: «${appName}» successfully deleted!`, 'success')
      navigate(`/key/${npub}`)
    } catch (error: any) {
      notify(error?.message || 'Failed to delete app', 'error')
    }
  }

  const handleShowAppDetailsModal = () => handleOpenModal(MODAL_PARAMS_KEYS.APP_DETAILS)

  return (
    <>
      <Stack maxHeight={'100%'} overflow={'auto'} alignItems={'flex-start'} height={'100%'}>
        <IOSBackButton onNavigate={() => navigate(`key/${npub}`)} />
        <Stack marginBottom={'1rem'} direction={'row'} gap={'1rem'} width={'100%'} alignItems={'center'}>
          <StyledAppIcon src={icon}>{appAvatarTitle}</StyledAppIcon>
          <Box flex={'1'} overflow={'hidden'}>
            <Stack direction={'row'} alignItems={'flex-start'} gap={'0.5rem'} marginBottom={'0.5rem'}>
              <Box display={'flex'} flexDirection={'column'} flex={1}>
                <Typography variant="h4" noWrap>
                  {appName}
                </Typography>
                {isAppNameExists && (
                  <Typography noWrap display={'block'} variant="body1" color={'GrayText'}>
                    {shortAppNpub}
                  </Typography>
                )}
              </Box>
              <IconButton onClick={handleShowAppDetailsModal}>
                <MoreIcon />
              </IconButton>
            </Stack>
            <Typography variant="body2" noWrap>
              {connectedOn}
            </Typography>
          </Box>
        </Stack>
        <Box marginBottom={'1rem'}>
          <SectionTitle marginBottom={'0.5rem'}>Disconnect</SectionTitle>
          <Button fullWidth onClick={handleShow}>
            Delete app
          </Button>
        </Box>
        <Permissions perms={perms} />

        <Button fullWidth onClick={() => handleOpenModal(MODAL_PARAMS_KEYS.ACTIVITY)}>
          Activity
        </Button>
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
    </>
  )
}

export default AppPage
