import { Stack, StackProps, styled } from "@mui/material";

export const StyledSettingContainer = styled((props: StackProps) => (
  <Stack gap={'0.75rem'} component={'form'} {...props} />
))(({ theme }) => ({
  padding: '1rem',
  borderRadius: '1rem',
  background: theme.palette.background.default,
  color: theme.palette.text.primary,
}))