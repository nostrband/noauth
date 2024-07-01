import { FC } from 'react'
import { getDeviceIcons } from './helpers'
import { Container, IconWrapper } from './styled'
import { useAppSelector } from '@/store/hooks/redux'
import { MacOSLightIcon } from '@/assets/icons/os'

type DeviceInfoProps = {
  info: string
}

export const DeviceInfo: FC<DeviceInfoProps> = ({ info = '' }) => {
  const darkMode = useAppSelector((state) => state.ui.themeMode === 'dark')

  const Icon = getDeviceIcons(info)
  if (!info || !Icon) return null

  const [browser, os] = info.split(', ')

  if (Array.isArray(Icon)) {
    const [BrowserIcon, OSIcon] = Icon
    return (
      <Container>
        <IconWrapper title={os}>{darkMode && os === 'Mac' ? <MacOSLightIcon /> : <OSIcon />}</IconWrapper>
        <IconWrapper title={browser}>
          <BrowserIcon />
        </IconWrapper>
      </Container>
    )
  }

  return (
    <Container>
      <IconWrapper title={browser}>
        <Icon />
      </IconWrapper>
    </Container>
  )
}
