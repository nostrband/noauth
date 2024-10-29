import { VariantType } from 'notistack'

type Variant = Exclude<VariantType, 'default' | 'info'>

export const BORDER_STYLES: Record<Variant, string> = {
  error: '#b90e0a',
  success: '#32cd32',
  warning: '#FF9500',
}
