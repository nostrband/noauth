import { DbApp } from '@/modules/db'
import { Avatar, Stack, Typography } from '@mui/material'
import { FC } from 'react'
import { Link } from 'react-router-dom'
import { getAppIconTitle, getDomain, getShortenNpub } from '@/utils/helpers/helpers'
import { StyledItemAppContainer } from './styled'

type ItemAppProps = DbApp

export const ItemApp: FC<ItemAppProps> = ({ npub, appNpub, icon, name, url }) => {
  const appDomain = getDomain(url)
  const appName = name || appDomain || getShortenNpub(appNpub)
  const appIcon = icon || `https://${appDomain}/favicon.ico`
	const appAvatarTitle = getAppIconTitle(name || appDomain, appNpub)
  return (
    <StyledItemAppContainer
      direction={'row'}
      alignItems={'center'}
      gap={'0.5rem'}
      padding={'0.5rem 0'}
      component={Link}
      to={`/key/${npub}/app/${appNpub}`}
    >
      <Avatar 
        variant="rounded" 
        sx={{ width: 56, height: 56 }} 
        src={appIcon} 
        alt={appName}
      >
        {appAvatarTitle}
      </Avatar>
      <Stack>
        <Typography noWrap display={'block'} variant="body2">
          {appName}
        </Typography>
        <Typography noWrap display={'block'} variant="caption" color={'GrayText'}>
          Basic actions
        </Typography>
      </Stack>
    </StyledItemAppContainer>
  )
}
