import { Metadata } from './types'

export const parseMetadata = (json: string): Metadata | null => {
  try {
    console.log({ json })

    const parsedJson: Metadata = JSON.parse(json)
    return parsedJson
  } catch (error) {
    return null
  }
}
