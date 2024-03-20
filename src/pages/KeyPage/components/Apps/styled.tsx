import {
  Accordion,
  AccordionDetails,
  AccordionDetailsProps,
  AccordionProps,
  AccordionSummary,
  AccordionSummaryProps,
  Stack,
  StackProps,
  styled,
} from '@mui/material'

export const StyledItemAppContainer = styled(<C extends React.ElementType>(props: StackProps<C, { component?: C }>) => (
  <Stack {...props} direction={'row'} />
))(({ theme }) => ({
  textDecoration: 'none',
  boxShadow: 'none',
  color: theme.palette.text.primary,
  background: theme.palette.backgroundSecondary.default,
  borderRadius: '12px',
  gap: '0.5rem',
  alignItems: 'center',
  ':hover': {
    background: `${theme.palette.backgroundSecondary.default}95`,
  },
  padding: '0.5rem 1rem',
}))

export const StyledAccordion = styled((props: AccordionProps) => <Accordion {...props} elevation={0} />)(
  ({ theme }) => ({
    background: theme.palette.backgroundSecondary.default,
    ':hover': {
      background: `${theme.palette.backgroundSecondary.default}95`,
    },
    borderRadius: '12px !important',
    padding: '0.5rem 1rem',
  })
)

export const StyledAccordionSummary = styled((props: AccordionSummaryProps) => (
  <AccordionSummary {...props} classes={{ content: 'content', expanded: 'expanded' }} />
))(() => ({
  padding: 0,
  '& .content': {
    margin: 0,
  },
  '&.expanded .content': {
    margin: '0.5rem 0',
  },
}))

export const StyledAccordionDetails = styled((props: AccordionDetailsProps) => <AccordionDetails {...props} />)(() => ({
  padding: 0,
}))
