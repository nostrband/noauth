import { format } from 'date-fns'

export const formatTimestampDate = (timestamp: number) => {
  try {
    const date = new Date(timestamp)
    const formattedDate = format(date, "dd-MM-yyyy HH:mm")
    return formattedDate
  } catch (error) {
    return ''
  }
}
