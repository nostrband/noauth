import React, { FC, useEffect, useState } from 'react'

const failedCache = new Map<string, boolean>()

export const IconApp: FC<{ picture: string }> = ({ picture }) => {
	const c = failedCache.get(picture)
	const [isFailed, setIsFailed] = useState(c !== undefined ? c : true)

	useEffect(() => {
		const c = failedCache.get(picture)
		if (c !== undefined) {
			setIsFailed(c)
			return
		}
		setIsFailed(true)

		const img = new Image()
		img.src = picture
		img.onerror = () => {
			setIsFailed(true)
			failedCache.set(picture, true)
		}
		img.onload = () => {
			setIsFailed(false)
			failedCache.set(picture, false)
		}
	}, [picture])

	return <div>IconApp</div>
}
