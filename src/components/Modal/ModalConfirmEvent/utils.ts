export const printPrettyJson = (params: string) => {
  try {
    const paramsArray: any[] = JSON.parse(params)
    const parseParams = paramsArray.map((param) => JSON.parse(param))
    return JSON.stringify(parseParams, null, 3)
  } catch (error) {
    return ''
  }
}
