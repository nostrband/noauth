import { useCallback, useMemo, useState } from 'react'
import { IconButton } from '@mui/material'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'

export const usePassword = () => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)

  const handlePasswordTypeChange = useCallback(() => setIsPasswordShown((prevState) => !prevState), [])

  const hidePassword = useCallback(() => setIsPasswordShown(false), [])

  const inputProps = useMemo(
    () => ({
      endAdornment: (
        <IconButton size="small" onClick={handlePasswordTypeChange}>
          {isPasswordShown ? (
            <VisibilityOffOutlinedIcon htmlColor="#6b6b6b" />
          ) : (
            <VisibilityOutlinedIcon htmlColor="#6b6b6b" />
          )}
        </IconButton>
      ),
      type: isPasswordShown ? 'text' : 'password',
    }),
    [handlePasswordTypeChange, isPasswordShown]
  )

  return { inputProps, hidePassword }
}
