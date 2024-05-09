import { FC, useEffect, useState } from 'react'
import { StyledAppIcon, StyledAppImg } from './styled'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import { IIconApp } from './types'

const failedCache = new Map<string, string>()

const fetchImage = async (src: string): Promise<string> => {
  return new Promise((ok, err) => {
    const img = new Image()
    img.src = src
    img.onerror = () => {
      err(new Error('Failed to fetch image ' + src))
    }
    img.onload = () => {
      ok(src)
    }
  })
}

export const IconApp: FC<IIconApp> = ({
  picture = '',
  domain = '',
  alt,
  isSmall,
  onClick,
  size,
  getAppTitle,
  isRounded = false,
  ...rest
}) => {
  // if picture provided - use it and don't be smart,
  // otherwise if domain provided try favicon first,
  // if fails - download manifest and look up there

  const [src, setSrc] = useState('')
  const [isFailed, setIsFailed] = useState(true)

  useEffect(() => {
    const id = picture || domain
    const cachedSrc = failedCache.get(id)
    if (cachedSrc !== undefined) {
      setIsFailed(cachedSrc === '')
      setSrc(cachedSrc)
      return
    }

    const load = async () => {
      const queue: string[] = []
      if (picture) queue.push(picture)
      if (domain) {
        queue.push(`https://${domain}/favicon.ico`)
        queue.push(`https://${domain}/favicon.png`)
      }

      // try all enqueued images
      for (const url of queue) {
        try {
          await fetchImage(url)
          return url
        } catch {}
      }

      // FIXME also try loading the homepage and parse
      // and get <link rel='icon'>

      // try w/ manifest
      if (!domain) throw new Error('No domain')

      const manifestQueue = [`https://${domain}/manifest.json`, `https://${domain}/manifest.webmanifest`]
      for (const url of manifestQueue) {
        try {
          const r = await fetch(url)
          const manifest = await r.json()
          const icon = manifest.icons[0].src
          const path = !icon || icon.startsWith('/') ? icon : `/${icon}`
          const src = !icon || icon.startsWith('https://') || icon.startsWith('//') ? icon : `https://${domain}${path}`
          if (src) {
            await fetchImage(src)
            return src
          }
        } catch {}
      }

      throw new Error("No icon in manifest")
    }
    load()
      .then((url) => {
        setSrc(url)
        setIsFailed(false)
        failedCache.set(id, url)
      })
      .catch((e) => {
        failedCache.set(id, '')
        setIsFailed(true)
      })
  }, [picture, domain])

  return (
    <StyledAppIcon isNotLoaded={isFailed} size={size} onClick={onClick} {...rest} isRounded={isRounded}>
      {alt ? (
        <StyledAppImg size={size} alt={alt} isSmall={isSmall} src={isFailed ? '' : src}>
          {isFailed && (
            <div className="MuiAvatar-root MuiAvatar-square MuiAvatar-colorDefault">
              {getAppTitle && typeof getAppTitle === 'function' ? getAppTitle(alt) : alt.substring(0, 1).toUpperCase()}
            </div>
          )}
        </StyledAppImg>
      ) : (
        <StyledAppImg size={size} alt={alt} isSmall={isSmall} src={isFailed ? '/' : src}>
          <ImageOutlinedIcon fontSize="inherit" />
        </StyledAppImg>
      )}
    </StyledAppIcon>
  )
}
