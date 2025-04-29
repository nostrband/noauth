import React, { FC, useState } from 'react'
import { Box, IconButton, Stack, Typography, useMediaQuery } from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { StyledAccordion, StyledAccordionDetails, StyledAccordionSummary } from './styled'
import { IAppGroup } from '@/types/general'
import { getAppIconTitle, getDomainPort } from '@/utils/helpers/helpers'
import { formatDistanceToNow } from 'date-fns'
import { ItemApp } from './ItemApp'
import { DbApp, DbPerm } from '@noauth/common'
import { IconApp } from '@/shared/IconApp/IconApp'
import { getShortenNpub } from '@noauth/common'

type AppGroupProps = IAppGroup & { perms: DbPerm[] }

export const AppGroup: FC<AppGroupProps> = ({
  apps,
  icon,
  url,
  name,
  appNpub,
  size,
  timestamp,
  perms = [],
  lastActive,
}) => {
  const matches = useMediaQuery('(max-width:320px)')

  const [expanded, setExpanded] = useState(false)
  const appDomain = getDomainPort(url)
  const shortAppNpub = getShortenNpub(appNpub)
  const appName = name || appDomain || shortAppNpub
  const appIcon = icon
  const appAvatarTitle = getAppIconTitle(name || appDomain, appNpub)

  const handleExpandClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  const getAppPerms = (app: DbApp) => {
    return perms.filter((perm) => perm.appNpub === app.appNpub)
  }

  const lastActiveDate = formatDistanceToNow(new Date(Math.max(lastActive, timestamp)), {
    addSuffix: true,
  })

  return (
    <StyledAccordion expanded={expanded} onClick={handleExpandClick}>
      <StyledAccordionSummary
        expandIcon={
          <IconButton>
            <ExpandMoreRoundedIcon />
          </IconButton>
        }
      >
        <Stack direction={'row'} gap={'0.5rem'} width={'100%'}>
          <Box minWidth={'fit-content'}>
            <IconApp
              picture={appIcon}
              domain={appDomain}
              alt={appAvatarTitle}
              size={matches ? 'medium' : 'large'}
              getAppTitle={() => appAvatarTitle}
            />
          </Box>
          <Stack width={'100%'} overflow={'hidden'}>
            <Typography noWrap variant="body1">
              {appName}
            </Typography>
            <Typography noWrap variant="body2" color={'GrayText'}>
              {size} connections
            </Typography>
            <Typography noWrap variant="caption" color={'GrayText'}>
              Active: {lastActiveDate}
            </Typography>
          </Stack>
        </Stack>
      </StyledAccordionSummary>

      <StyledAccordionDetails>
        <Stack gap={'0.5rem'} overflow={'auto'} flex={1} paddingBottom={'0.75rem'}>
          {apps.map((a) => (
            <ItemApp groupedApp {...a} key={a.appNpub} perms={getAppPerms(a)} />
          ))}
        </Stack>
      </StyledAccordionDetails>
    </StyledAccordion>
  )
}
