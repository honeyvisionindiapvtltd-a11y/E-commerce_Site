import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { CommerceProvider } from './context/index.js'
import { migrateOldLocalStorage } from './context/storageeMigration.js'

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
