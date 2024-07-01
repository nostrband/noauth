import {
  EdgeIcon,
  FirefoxIcon,
  ChromeIcon,
  ChromiumIcon,
  OperaIcon,
  SafariIcon,
  SeamonkeyIcon,
} from '@/assets/icons/browsers'
import { AndroidIcon, IOSIcon, LinuxIcon, MacOSDarkIcon, WindowsIcon } from '@/assets/icons/os'
import { IDeviceIconsMap } from './types'

export const DEVICE_ICONS: IDeviceIconsMap = {
  // Browsers
  Seamonkey: SeamonkeyIcon,
  Firefox: FirefoxIcon,
  Chromium: ChromiumIcon,
  Safari: SafariIcon,
  Edge: EdgeIcon,
  Chrome: ChromeIcon,
  Opera: OperaIcon,
  //OS
  Android: AndroidIcon,
  Linux: LinuxIcon,
  iOS: IOSIcon,
  Mac: MacOSDarkIcon,
  Windows: WindowsIcon,
  // SeamonkeyIcon with OS
  'Seamonkey, Android': [SeamonkeyIcon, AndroidIcon],
  'Seamonkey, Linux': [SeamonkeyIcon, LinuxIcon],
  'Seamonkey, iOS': [SeamonkeyIcon, IOSIcon],
  'Seamonkey, Mac': [SeamonkeyIcon, MacOSDarkIcon],
  'Seamonkey, Windows': [SeamonkeyIcon, WindowsIcon],
  // Firefox with OS
  'Firefox, Android': [FirefoxIcon, AndroidIcon],
  'Firefox, Linux': [FirefoxIcon, LinuxIcon],
  'Firefox, iOS': [FirefoxIcon, IOSIcon],
  'Firefox, Mac': [FirefoxIcon, MacOSDarkIcon],
  'Firefox, Windows': [FirefoxIcon, WindowsIcon],
  // Chromium with OS
  'Chromium, Android': [ChromiumIcon, AndroidIcon],
  'Chromium, Linux': [ChromiumIcon, LinuxIcon],
  'Chromium, iOS': [ChromiumIcon, IOSIcon],
  'Chromium, Mac': [ChromiumIcon, MacOSDarkIcon],
  'Chromium, Windows': [ChromiumIcon, WindowsIcon],
  // Chromium with OS
  'Safari, Android': [SafariIcon, AndroidIcon],
  'Safari, Linux': [SafariIcon, LinuxIcon],
  'Safari, iOS': [SafariIcon, IOSIcon],
  'Safari, Mac': [SafariIcon, MacOSDarkIcon],
  'Safari, Windows': [SafariIcon, WindowsIcon],
  // Edge with OS
  'Edge, Android': [EdgeIcon, AndroidIcon],
  'Edge, Linux': [EdgeIcon, LinuxIcon],
  'Edge, iOS': [EdgeIcon, IOSIcon],
  'Edge, Mac': [EdgeIcon, MacOSDarkIcon],
  'Edge, Windows': [EdgeIcon, WindowsIcon],
  // Chrome with OS
  'Chrome, Android': [ChromeIcon, AndroidIcon],
  'Chrome, Linux': [ChromeIcon, LinuxIcon],
  'Chrome, iOS': [ChromeIcon, IOSIcon],
  'Chrome, Mac': [ChromeIcon, MacOSDarkIcon],
  'Chrome, Windows': [ChromeIcon, WindowsIcon],
  // Opera with OS
  'Opera, Android': [OperaIcon, AndroidIcon],
  'Opera, Linux': [OperaIcon, LinuxIcon],
  'Opera, iOS': [OperaIcon, IOSIcon],
  'Opera, Mac': [OperaIcon, MacOSDarkIcon],
  'Opera, Windows': [OperaIcon, WindowsIcon],
}
