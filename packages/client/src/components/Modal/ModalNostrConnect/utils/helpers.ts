import { Metadata } from './types'

export const parseMetadata = (json: string): Metadata | null => {
  try {
    const parsedJson: Metadata = JSON.parse(json)
    return parsedJson
  } catch (error) {
    console.log('Failed to parse metadata =>', error)
    return null
  }
}