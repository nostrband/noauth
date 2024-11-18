import { getDomainPort } from '@/utils/helpers/helpers'
import { Metadata } from './types'

const parseMetadata = (json: string): Metadata | null => {
  try {
    // console.log({ json })
    const parsedJson: Metadata = JSON.parse(json)
    return parsedJson
  } catch (error) {
    // console.log('Failed to parse metadata =>', { error })
    return null
  }
}

export const parseNostrConnectMeta = (search: string) => {
  const searchParams = new URLSearchParams(search)
  const metadataJson = searchParams.get('metadata') || ''
  const metadata = parseMetadata(metadataJson) || {
    url: searchParams.get('url'),
    name: searchParams.get('name'),
    icon: searchParams.get('image'),
    perms: searchParams.get('perms'),
  }
  if (!metadata.url && !metadata.name && !metadata.icon) return undefined

  return {
    appName: metadata.name || '',
    appUrl: metadata.url || '',
    appDomain: getDomainPort(metadata.url || ''),
    appIcon: metadata.icon || '',
    perms: metadata.perms || '',
  }
}
