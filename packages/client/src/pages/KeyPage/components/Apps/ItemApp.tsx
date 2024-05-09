import { DbPerm } from "@noauth/common"
import { Stack, Typography, useMediaQuery } from '@mui/material'
import { FC, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getAppDevice, getAppIconTitle, getDomainPort } from '@/utils/helpers/helpers'
import { StyledItemAppContainer } from './styled'
import { formatDistanceToNow } from 'date-fns'
import { IClientApp } from '@/types/general'
import { IconApp } from '@/shared/IconApp/IconApp'
import { getShortenNpub } from '@noauth/common'

type ItemAppProps = IClientApp & { perms: DbPerm[]; groupedApp?: boolean }

export const ItemApp: FC<ItemAppProps> = ({
  npub,
  appNpub,
  icon,
  name,
  url,
  timestamp,
  userAgent = '',
  perms = [],
  lastActive = 0,
  groupedApp = false,
}) => {
  const matches = useMediaQuery('(max-width:320px)')

  const appDomain = getDomainPort(url)
  const shortAppNpub = getShortenNpub(appNpub)
  const appName = name || appDomain || shortAppNpub
  const appIcon = icon
  const appAvatarTitle = getAppIconTitle(name || appDomain, appNpub)
  const appDevice = getAppDevice(userAgent)

  const getPermsType = useCallback(() => {
    const isIncludeBasic = perms.some((perm) => perm.perm === 'basic')
    return isIncludeBasic ? 'Basic actions' : 'On demand'
  }, [perms])

  const lastActiveDate = formatDistanceToNow(new Date(lastActive || timestamp), {
    addSuffix: true,
  })

  return (
    <StyledItemAppContainer component={Link} to={`/key/${npub}/app/${appNpub}`}>
      {!groupedApp && (
        <IconApp
          domain={appDomain}
          picture={appIcon}
          alt={appAvatarTitle}
          size={matches ? 'medium' : 'large'}
          getAppTitle={() => appAvatarTitle}
        />
      )}
      <Stack>
        <Typography noWrap display={'block'} variant="body1">
          {groupedApp ? (appDevice || appName) : (appName)}
        </Typography>
        <Typography noWrap display={'block'} variant="body2" color={'GrayText'}>
          {getPermsType()}
        </Typography>
        <Typography noWrap display={'block'} variant="caption" color={'GrayText'}>
          Active: {lastActiveDate}
        </Typography>
      </Stack>
    </StyledItemAppContainer>
  )
}
