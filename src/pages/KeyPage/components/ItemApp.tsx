import { DbApp } from '@/modules/db'
import { Avatar, Stack, Typography } from '@mui/material'
import { FC } from 'react'
import { Link } from 'react-router-dom'
// import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import { getShortenNpub } from '@/utils/helpers/helpers'
import { StyledItemAppContainer } from './styled'

type ItemAppProps = DbApp

export const ItemApp: FC<ItemAppProps> = ({ npub, appNpub, icon, name }) => {
  const appName = name || getShortenNpub(appNpub)
  return (
    <StyledItemAppContainer
      direction={'row'}
      alignItems={'center'}
      gap={'0.5rem'}
      padding={'0.5rem 0'}
      component={Link}
      to={`/key/${npub}/app/${appNpub}`}
    >
      <Avatar variant="square" sx={{ width: 56, height: 56 }} src={icon} alt={name} />
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
