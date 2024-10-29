// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// @ts-ignore
import Test from '@noauth/client-ui'

createRoot(document.getElementById('root')!).render(<Test />)
