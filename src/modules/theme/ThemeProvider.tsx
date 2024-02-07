import { FC, PropsWithChildren } from 'react'
import { ThemeProvider as ThemeMuiProvider, CssBaseline } from '@mui/material'
import { darkTheme, lightTheme } from './theme'
import { useAppSelector } from '../../store/hooks/redux'

const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  const themeMode = useAppSelector((state) => state.ui.themeMode)
  const isDarkMode = themeMode === 'dark'

  return (
    <ThemeMuiProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      {children}
    </ThemeMuiProvider>
  )
}

export default ThemeProvider
