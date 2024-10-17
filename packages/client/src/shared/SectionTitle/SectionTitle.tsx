import { FC } from 'react'
import { Typography, TypographyProps, styled } from '@mui/material'

type SectionTitleProps = TypographyProps

export const SectionTitle: FC<SectionTitleProps> = ({ children, ...rest }) => {
  return <StyledTypography {...rest}>{children}</StyledTypography>
}

const StyledTypography = styled((props: TypographyProps) => <Typography {...props} variant="caption" />)(({
  theme,
}) => {
  const isDark = theme.palette.mode === 'dark'
  return {
    textTransform: 'uppercase',
    letterSpacing: '3px',
    display: 'block',
    color: isDark ? '#FFFFFF' : theme.palette.textSecondaryDecorate.main,
    fontWeight: 600,
  }
})
