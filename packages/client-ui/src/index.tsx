import React from 'react'
import App from './App'
import './index.css'
import ThemeProvider from './modules/theme/ThemeProvider'
import { BrowserRouter } from 'react-router-dom'
import { persistor, store } from './store'
import { PersistGate } from 'redux-persist/integration/react'
import { SnackbarProvider } from 'notistack'
import { Provider } from 'react-redux'

const Init = () => {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ThemeProvider>
              <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
                <App />
              </SnackbarProvider>
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </BrowserRouter>
    </React.StrictMode>
  )
}

export default Init
