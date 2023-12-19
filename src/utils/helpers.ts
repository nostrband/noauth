export async function log(s: string) {
	const log = document.getElementById('log')
	if (log) log.innerHTML = s
}

export async function call(cb: () => any) {
	try {
		return await cb()
	} catch (e) {
		log(`Error: ${e}`)
	}
}
