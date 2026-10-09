import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.jsx'
import { CommerceProvider } from './context/index.js'
import { migrateOldLocalStorage } from './context/storageeMigration.js'

document.documentElement.classList.toggle('capacitor-native', Capacitor.isNativePlatform())

// Migrate old localStorage format to new modular format (if needed)
migrateOldLocalStorage()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CommerceProvider>
        <App />
      </CommerceProvider>
    </BrowserRouter>
  </StrictMode>,
)
