import { FC, memo, useCallback } from 'react'
import { Stack, Typography } from '@mui/material'
import { StyledAlert, StyledReloadButton } from './styled'
import { useSessionStorage } from 'usehooks-ts'
import { RELOAD_STORAGE_KEY } from '@/utils/consts'

type ReloadBadgeContentProps = {
  onReload: () => void
}

const ReloadBadgeContent: FC<ReloadBadgeContentProps> = memo(({ onReload }) => {
  return (
    <StyledAlert>
      <Stack direction={'row'} className="content">
        <Typography flex={1} className="title">
          New version available!
        </Typography>
        <StyledReloadButton onClick={onReload}>Reload</StyledReloadButton>
      </Stack>
    </StyledAlert>
  )
})

export const ReloadBadge = () => {
  const [needReload, setNeedReload] = useSessionStorage(RELOAD_STORAGE_KEY, false)

  const handleReload = useCallback(() => {
    setNeedReload(false)
    window.location.reload()
  }, [setNeedReload])

  return <>{needReload && <ReloadBadgeContent onReload={handleReload} />}</>
}
