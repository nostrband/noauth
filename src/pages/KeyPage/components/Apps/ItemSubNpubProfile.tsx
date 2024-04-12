import { forwardRef } from 'react'
import { MenuItem, MenuItemProps, Stack } from '@mui/material'
import { useProfile } from '@/hooks/useProfile'
import { IconApp } from '@/shared/IconApp/IconApp'

type ItemSubNpubProfileProps = {
  subNpub: string
} & MenuItemProps

export const ItemSubNpubProfile = forwardRef<HTMLLIElement, ItemSubNpubProfileProps>(({ subNpub, ...rest }, ref) => {
  const { userAvatar, userName } = useProfile(subNpub)
  return (
    <MenuItem ref={ref} {...rest}>
      <Stack direction={'row'} gap={'0.5rem'} alignItems={'center'}>
        <IconApp size="extra-small" picture={userAvatar} alt={userName} isRounded />
        {userName}
      </Stack>
    </MenuItem>
  )
})
