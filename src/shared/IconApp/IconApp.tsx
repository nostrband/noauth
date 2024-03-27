import { FC, useEffect, useState } from 'react'
import { StyledAppIcon, StyledAppImg } from './styled'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import { IIconApp } from './types'

const failedCache = new Map<string, boolean>()

export const IconApp: FC<IIconApp> = ({ picture = '', alt, isSmall, onClick, size, getAppTitle, ...rest }) => {
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

  return (
    <StyledAppIcon isNotLoaded={isFailed} size={size} onClick={onClick} {...rest}>
      {alt ? (
        <StyledAppImg size={size} alt={alt} isSmall={isSmall} src={isFailed ? '' : picture}>
          {isFailed && (
            <div className="MuiAvatar-root MuiAvatar-square MuiAvatar-colorDefault">
              {getAppTitle && typeof getAppTitle === 'function' ? getAppTitle(alt) : alt.substring(0, 1).toUpperCase()}
            </div>
          )}
        </StyledAppImg>
      ) : (
        <StyledAppImg size={size} alt={alt} isSmall={isSmall} src={isFailed ? '/' : picture}>
          <ImageOutlinedIcon fontSize="inherit" />
        </StyledAppImg>
      )}
    </StyledAppIcon>
  )
}
