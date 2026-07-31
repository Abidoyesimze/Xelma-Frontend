import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // @ts-expect-error virtual:pwa-register module provided by vite-plugin-pwa
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onRegistered(registration: ServiceWorkerRegistration) {
        if (registration) {
          registration.update();
        }
      },
      onRegisterError(error: unknown) {
        console.warn('Service worker registration failed:', error)
      }
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
