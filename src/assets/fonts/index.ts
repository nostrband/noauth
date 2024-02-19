import pathExtraLight from './Inter/Inter-ExtraLight.ttf'
import pathLight from './Inter/Inter-Light.ttf'
import pathRegular from './Inter/Inter-Regular.ttf'
import pathMedium from './Inter/Inter-Medium.ttf'
import pathSemiBold from './Inter/Inter-SemiBold.ttf'
import pathBold from './Inter/Inter-Bold.ttf'

const createFont = (name: string, style: string, weight: number, url: string) => {
  return {
    fontFamily: name,
    fontStyle: style,
    fontDisplay: 'swap',
    fontWeight: `${weight}`,
    src: `
    local(${name}),
    url(${url}) format('woff2')
  `,
    unicodeRange:
      ' U+0000-00FF, U+0100-017F, U+0180-024F, U+0250-02AF, U+02B0-02FF, U+0300-036F, U+0370-03FF, U+0400-04FF, U+1F00-1FFF',
  }
}

const InterExtraLight = createFont('Inter', 'normal', 200, pathExtraLight)
const InterLight = createFont('Inter', 'normal', 300, pathLight)
const InterRegular = createFont('Inter', 'normal', 400, pathRegular)
const InterMedium = createFont('Inter', 'normal', 500, pathMedium)
const InterSemiBold = createFont('Inter', 'normal', 600, pathSemiBold)
const InterBold = createFont('Inter', 'normal', 700, pathBold)

export { InterExtraLight, InterLight, InterRegular, InterMedium, InterSemiBold, InterBold }
