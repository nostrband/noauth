import { FC, useState } from 'react'
import { DbHistory } from '@noauth/common'
import { Box, Collapse, Stack, Typography } from '@mui/material'
import { StyledActivityItem, StyledDetails } from './styled'
import { formatTimestampDate } from '@/utils/helpers/date'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import DoneRoundedIcon from '@mui/icons-material/DoneRounded'
import { getReqActionName } from '@/utils/helpers/helpers'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { getReqDetails, printPrettyJson } from '@/utils/helpers/helpers-frontend'
import { Button } from '@/shared/Button/Button'

type ItemActivityProps = DbHistory

const isJSON = (str: string): boolean => {
  try {
    const result = JSON.parse(str)
    return typeof result === 'object' && result !== null
  } catch (e) {
    return false
  }
}

export const ItemActivity: FC<ItemActivityProps> = (req) => {
  const { allowed, timestamp, result = '' } = req
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [showMoreResult, setShowMoreResult] = useState(false)
  const [details, setDetails] = useState('')

  const handleToggleShowDetails = () => {
    if (!showMoreDetails && !details) getReqDetails(req).then(setDetails)
    setShowMoreResult(false)
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

  const handleToggleShowResult = () => {
    setShowMoreDetails(false)
    setShowMoreResult((prevShow) => !prevShow)
  }

  return (
    <Stack gap={'0.5rem'}>
      <StyledActivityItem>
        <Stack direction={'row'}>
          <Box display={'flex'} flexDirection={'column'} gap={'0.5rem'} flex={1}>
            <Typography flex={1} fontWeight={700}>
              {getReqActionName(req)}
            </Typography>
            <Typography variant="body2">{formatTimestampDate(timestamp)}</Typography>
          </Box>
          <Box>{allowed ? <DoneRoundedIcon htmlColor="green" /> : <ClearRoundedIcon htmlColor="red" />}</Box>
        </Stack>
        <Stack direction={'row'} gap={'1rem'}>
          <Button
            varianttype="secondary"
            fullWidth
            onClick={handleToggleShowDetails}
            endIcon={<ExpandMoreRoundedIcon />}
          >
            Parameters
          </Button>
          <Button
            varianttype="secondary"
            fullWidth
            onClick={handleToggleShowResult}
            endIcon={<ExpandMoreRoundedIcon />}
          >
            Result
          </Button>
        </Stack>
      </StyledActivityItem>

      <Collapse in={showMoreDetails} hidden={showMoreResult}>
        {details ? (
          <StyledDetails>
            <pre>{details}</pre>
          </StyledDetails>
        ) : (
          <Typography textAlign={'center'} fontSize={'1.25rem'} fontWeight={500} color={'GrayText'}>
            No details
          </Typography>
        )}
      </Collapse>
      <Collapse in={showMoreResult} hidden={showMoreDetails}>
        {result ? (
          <StyledDetails>
            <pre>{isJSON(result) ? printPrettyJson(result) : result}</pre>
          </StyledDetails>
        ) : (
          <Typography textAlign={'center'} fontSize={'1.25rem'} fontWeight={500} color={'GrayText'}>
            No result
          </Typography>
        )}
      </Collapse>
    </Stack>
  )
}
