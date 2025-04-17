import { FC, useState } from 'react'
import { Warning } from '@/components/Warning/Warning'
import { Button } from '@/shared/Button/Button'
import { IconButton, Stack, styled, Typography, TypographyProps } from '@mui/material'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import SettingsApplicationsOutlinedIcon from '@mui/icons-material/SettingsApplicationsOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import { client } from '@/modules/client'

type UploadEnclaveWarningProps = {
  npub: string
  onBadgeClose: () => Promise<void>
}

export const UploadEnclaveWarning: FC<UploadEnclaveWarningProps> = ({ npub, onBadgeClose }) => {
  const [isPending, setIsPending] = useState(false)

  const { handleOpen } = useModalSearchParams()

  const handleSetupClick = () => {
    handleOpen(MODAL_PARAMS_KEYS.ENCLAVE_SETUP, {
      search: {
        mode: 'badge',
      },
    })
  }
  const handleCloseWarning = async () => {
    try {
      if (isPending) return

      setIsPending(true)
      await client.setEnclaveBadgeHidden(npub)
      await onBadgeClose()
      setIsPending(false)
    } catch (error) {
      console.log(error)
      setIsPending(false)
    }
  }
  return (
    <Warning
      message={
        <Stack justifyContent={'space-between'} alignItems={'center'} width={'100%'} direction={'row'}>
          <Stack>
            <Typography variant="body1" noWrap fontWeight={'500'} textOverflow={'ellipsis'}>
              Use secure enclave
            </Typography>
            <StyledHint>Enable for more reliable performance</StyledHint>
          </Stack>

          <Stack direction={'row'} alignItems={'center'} gap={'0.5rem'}>
            <Button
              // endIcon={<SettingsApplicationsOutlinedIcon />}
              onClick={handleSetupClick}
            >
              Set up
            </Button>
            <IconButton onClick={handleCloseWarning} disabled={isPending}>
              <CloseOutlinedIcon />
            </IconButton>
          </Stack>
        </Stack>
      }
      icon={<CloudUploadOutlinedIcon htmlColor="white" />}
    />
  )
}

const StyledHint = styled((props: TypographyProps) => <Typography variant="body2" {...props} />)(() => ({
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}))
