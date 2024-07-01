import { FC, useState } from 'react'
import { DbHistory } from '@noauth/common'
import { Box, Collapse, IconButton, Stack, Typography } from '@mui/material'
import { StyledActivityItem, StyledDetails } from './styled'
import { formatTimestampDate } from '@/utils/helpers/date'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import DoneRoundedIcon from '@mui/icons-material/DoneRounded'
import { getReqActionName } from '@/utils/helpers/helpers'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { getReqDetails } from '@/utils/helpers/helpers-frontend'

type ItemActivityProps = DbHistory

export const ItemActivity: FC<ItemActivityProps> = (req) => {
  const { allowed, timestamp } = req
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [details, setDetails] = useState('')

  const handleToggleShowDetails = () => {
    if (!showMoreDetails && !details) getReqDetails(req).then(setDetails)
    setShowMoreDetails((prevShow) => !prevShow)
  }

  // with useeffect we send a series of calls to backend,
  // and it's not pretty
  // useEffect(() => {
  //   const load = async () => {
  //     const details = await getReqDetails(req)
  //     setDetails(details)
  //   }
  //   if (showMoreDetails && !details)
  //     load()
  //   // eslint-disable-next-line
  // }, [req, showMoreDetails])

  return (
    <Stack gap={'0.5rem'}>
      <StyledActivityItem>
        <Box display={'flex'} flexDirection={'column'} gap={'0.5rem'} flex={1}>
          <Typography flex={1} fontWeight={700}>
            {getReqActionName(req)}
          </Typography>
          <Typography variant="body2">{formatTimestampDate(timestamp)}</Typography>
        </Box>
        <Box>{allowed ? <DoneRoundedIcon htmlColor="green" /> : <ClearRoundedIcon htmlColor="red" />}</Box>
        <IconButton onClick={handleToggleShowDetails}>
          <ExpandMoreIcon />
        </IconButton>
      </StyledActivityItem>
      <Collapse in={showMoreDetails}>
        <StyledDetails>
          {details ? (
            <pre>{details}</pre>
          ) : (
            <Typography textAlign={'center'} variant="subtitle2">
              No details
            </Typography>
          )}
        </StyledDetails>
      </Collapse>
    </Stack>
  )
}
