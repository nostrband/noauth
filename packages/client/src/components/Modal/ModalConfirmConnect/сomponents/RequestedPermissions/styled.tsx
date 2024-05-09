import { FormControlLabel, FormControlLabelProps, ListItem, ListItemProps, styled } from '@mui/material'

export const StyledFormControlLabel = styled((props: FormControlLabelProps) => <FormControlLabel {...props} />)(() => ({
  gap: '0.5rem',
}))

export const StyledListItem = styled((props: ListItemProps) => <ListItem {...props} />)(() => ({
  '@media screen and (max-width: 485px)': {
    paddingTop: '0.25rem',
    paddingBottom: '0.25rem',
  },
}))
