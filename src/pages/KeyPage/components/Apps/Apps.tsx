import { DbApp } from '@/modules/db'
import { AppLink } from '@/shared/AppLink/AppLink'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { Box, Stack, Typography } from '@mui/material'
import { FC } from 'react'
import { StyledEmptyAppsBox } from '../../styled'
import { Button } from '@/shared/Button/Button'
import { ItemApp } from './ItemApp'
import { useAppSelector } from '@/store/hooks/redux'
import { selectPermsByNpub } from '@/store'
import { Navigate, useParams } from 'react-router-dom'
import { groupAppsByURL } from './utils'
import { AppGroup } from './AppGroup'
import { IClientApp } from '@/types/general'

type AppsProps = {
  apps: IClientApp[]
  npub: string
}

export const Apps: FC<AppsProps> = ({ apps = [] }) => {
  const { npub = '' } = useParams()
  const perms = useAppSelector((state) => selectPermsByNpub(state, npub))
  const keys = useAppSelector((state) => state.content.keys)

  const key = keys.find((k) => k.npub === npub)
  const isKeyExists = npub.trim().length && key

  const groupedApps = groupAppsByURL(apps)

  if (!isKeyExists) return <Navigate to={`/home`} />

  const openAppStore = () => {
    window.open('https://nostrapp.link', '_blank')
  }

  const getAppPerms = (app: DbApp) => {
    return perms.filter((perm) => perm.appNpub === app.appNpub)
  }

  return (
    <Box marginBottom={'1rem'} display={'flex'} flexDirection={'column'}>
      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} marginBottom={'0.5rem'}>
        <SectionTitle>Connected apps</SectionTitle>
        <AppLink title="Discover Apps" onClick={openAppStore} />
      </Stack>
      {!apps.length && (
        <StyledEmptyAppsBox>
          <Typography className="message" variant="h5" fontWeight={600} textAlign={'center'}>
            No connected apps
          </Typography>
          <Button onClick={openAppStore}>Discover Nostr Apps</Button>
        </StyledEmptyAppsBox>
      )}

      <Stack gap={'0.5rem'} overflow={'auto'} flex={1} paddingBottom={'0.75rem'}>
        {groupedApps.map((appGroup) => {
          if (appGroup.size === 1) {
            const [app] = appGroup.apps
            return <ItemApp {...app} key={app.appNpub} perms={getAppPerms(app)} />
          }
          return <AppGroup {...appGroup} key={appGroup.url} perms={perms} />
        })}
      </Stack>
    </Box>
  )
}
