import { Typography, TypographyProps, styled } from '@mui/material'
import React, { FC } from 'react'

type AppLinkProps = {
  title: string
} & TypographyProps

export const AppLink: FC<AppLinkProps> = ({ title = '', ...rest }) => {
  return <StyledTypography {...rest}>{title}</StyledTypography>
}

const StyledTypography = styled((props: TypographyProps) => <Typography {...props} variant="caption" />)(({
  theme,
}) => {
  return {
    color: theme.palette.textSecondaryDecorate.main,
    cursor: 'pointer',
    '&:active': {
      textDecoration: 'underline',
    },
  }
})
