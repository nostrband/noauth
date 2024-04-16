import { DEVICE_ICONS } from './const'

export const getDeviceIcons = (info = '') => {
  return DEVICE_ICONS[info] || ''
}
