import { format } from 'date-fns'

export const formatTimestampDate = (timestamp: number) => {
	try {
		const date = new Date(timestamp)
		const formattedDate = format(date, "HH:mm',' dd-MM-yyyy")
		return formattedDate
	} catch (error) {
		return ''
	}
}
