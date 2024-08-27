import { FC } from 'react'
import { Warning } from '@/components/Warning/Warning'
import { CircularProgress, Stack, Typography, TypographyProps, styled } from '@mui/material'
import AutoModeOutlinedIcon from '@mui/icons-material/AutoModeOutlined'

type BackgroundSigningWarningProps = {
  isEnabling: boolean
  onEnableBackSigning: () => void
}

export const BackgroundSigningWarning: FC<BackgroundSigningWarningProps> = ({ isEnabling, onEnableBackSigning }) => {
  return (
    <Warning
      message={
        <Stack gap={'0.25rem'} overflow={'auto'} width={'100%'}>
          <Typography variant="body1" noWrap fontWeight={'500'}>
            Enable background service
          </Typography>
          <StyledHint>Please allow notifications for background operation.</StyledHint>
        </Stack>
      }
      icon={
        isEnabling ? (
          <CircularProgress size={'1.5rem'} sx={{ color: '#fff' }} />
        ) : (
          <AutoModeOutlinedIcon htmlColor="white" />
        )
      }
      onClick={isEnabling ? undefined : onEnableBackSigning}
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
