import { DbPerm } from '@/modules/db'
import { Stack, Typography, useMediaQuery } from '@mui/material'
import { FC, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getAppIconTitle, getDomain, getShortenNpub } from '@/utils/helpers/helpers'
import { StyledItemAppContainer } from './styled'
import { formatDistanceToNow } from 'date-fns'
import { IClientApp } from '@/types/general'
import { IconApp } from '@/shared/IconApp/IconApp'

type ItemAppProps = IClientApp & { perms: DbPerm[] }

export const ItemApp: FC<ItemAppProps> = ({ npub, appNpub, icon, name, url, perms = [], lastActive = 0 }) => {
  const matches = useMediaQuery('(max-width:320px)')

  const appDomain = getDomain(url)
  const shortAppNpub = getShortenNpub(appNpub)
  const appName = name || appDomain || shortAppNpub
  const appIcon = icon || `https://${appDomain}/favicon.ico`
  const appAvatarTitle = getAppIconTitle(name || appDomain, appNpub)

  const getPermsType = useCallback(() => {
    const isIncludeBasic = perms.some((perm) => perm.perm === 'basic')
    return isIncludeBasic ? 'Basic actions' : 'On demand'
  }, [perms])

  const lastActiveDate = formatDistanceToNow(new Date(lastActive), {
    addSuffix: true,
  })

  return (
    <StyledItemAppContainer component={Link} to={`/key/${npub}/app/${appNpub}`}>
      <IconApp
        picture={appIcon}
        alt={appAvatarTitle}
        size={matches ? 'medium' : 'large'}
        getAppTitle={() => appAvatarTitle}
      />
      <Stack>
        <Typography noWrap display={'block'} variant="body1">
          {appName}
        </Typography>
        <Typography noWrap display={'block'} variant="body2" color={'GrayText'}>
          {getPermsType()}
        </Typography>
        <Typography noWrap display={'block'} variant="caption" color={'GrayText'}>
          Last active: {lastActiveDate}
        </Typography>
      </Stack>
    </StyledItemAppContainer>
  )
}
