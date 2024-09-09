import { Metadata } from './types'

export const parseMetadata = (json: string): Metadata | null => {
  try {
    const parsedJson: Metadata = JSON.parse(json)
    return parsedJson
  } catch (error) {
    return null
  }
}
