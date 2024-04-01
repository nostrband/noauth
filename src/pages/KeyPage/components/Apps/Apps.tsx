import { DbApp } from '@/modules/db'
import { AppLink } from '@/shared/AppLink/AppLink'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { Box, MenuItem, Select, SelectChangeEvent, Stack, Typography } from '@mui/material'
import { FC, useEffect, useState } from 'react'
import { StyledEmptyAppsBox } from '../../styled'
import { Button } from '@/shared/Button/Button'
import { ItemApp } from './ItemApp'
import { useAppSelector } from '@/store/hooks/redux'
import { selectPermsByNpub } from '@/store'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { groupAppsByURL } from './utils'
import { AppGroup } from './AppGroup'

import { Input } from '@/shared/Input/Input'
import { usePrepareApps } from '../../hooks/usePrepareApps'
import { getShortenNpub } from '@/utils/helpers/helpers'
import { IconApp } from '@/shared/IconApp/IconApp'

export const Apps: FC = () => {
  const { npub = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const perms = useAppSelector((state) => selectPermsByNpub(state, npub))
  const keys = useAppSelector((state) => state.content.keys)
  const key = keys.find((k) => k.npub === npub)
  const isKeyExists = npub.trim().length && key

  const [sortAppsBy, setSortAppsBy] = useState(npub)

  const { apps, subNpubAppsExists, subNpubProfiles, onResetSubNpub, subNpub } = usePrepareApps(npub)
  const groupedApps = groupAppsByURL(apps)

  const handleChangeSortAppsBy = (event: SelectChangeEvent<string>) => {
    const value = event.target.value
    setSortAppsBy(value)
    if (value === npub) return onResetSubNpub()
    searchParams.set('subNpub', value)
    setSearchParams(searchParams)
  }

  useEffect(() => {
    if (!subNpub) {
      onResetSubNpub()
      setSortAppsBy(npub)
    } else {
      setSortAppsBy(subNpub)
    }
    // eslint-disable-next-line
  }, [subNpub, onResetSubNpub])

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

      {subNpubAppsExists && (
        <Stack marginBottom={'0.75rem'}>
          <Select input={<Input fullWidth mode="light" />} value={sortAppsBy} onChange={handleChangeSortAppsBy}>
            <MenuItem value={npub}>My connections</MenuItem>
            {subNpubProfiles.map((profile) => {
              return (
                <MenuItem key={profile.subNpub} value={profile.subNpub}>
                  <Stack direction={'row'} gap={'0.5rem'} alignItems={'center'}>
                    <IconApp size="extra-small" picture="" alt={profile.subNpub} isRounded />
                    {getShortenNpub(profile.subNpub)}
                  </Stack>
                </MenuItem>
              )
            })}
          </Select>
        </Stack>
      )}

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
