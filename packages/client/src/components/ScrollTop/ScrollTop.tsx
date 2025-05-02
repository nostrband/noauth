import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import { Fade, useScrollTrigger } from '@mui/material'
import { PositionContainer, StyledFab } from './styled'

export const ScrollTop = () => {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  })

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Fade in={trigger}>
      <PositionContainer onClick={handleClick} role="presentation">
        <StyledFab aria-label="Scroll back to top" color="secondary">
          <KeyboardArrowUpRoundedIcon fontSize="large" />
        </StyledFab>
      </PositionContainer>
    </Fade>
  )
}
