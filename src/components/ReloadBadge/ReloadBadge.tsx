import { FC } from 'react'
import { Collapse, Stack, Typography } from '@mui/material'
import { useSearchParams } from 'react-router-dom'
import { StyledAlert, StyledReloadButton } from './styled'

const ReloadBadgeContent: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const handleReload = () => {
    searchParams.delete('reload')
    setSearchParams(searchParams)
    window.location.reload()
  }
  return (
    <Collapse in>
      <StyledAlert>
        <Stack direction={'row'} className="content">
          <Typography flex={1} className="title">
            New version available!
          </Typography>
          <StyledReloadButton onClick={handleReload}>Reload</StyledReloadButton>
        </Stack>
      </StyledAlert>
    </Collapse>
  )
}

export const ReloadBadge = () => {
  const [searchParams] = useSearchParams()
  const open = searchParams.get('reload') === 'true'

  return <>{open && <ReloadBadgeContent />}</>
}
