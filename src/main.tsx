import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - virtual:pwa-register is resolved by vite-plugin-pwa at build time
  import('virtual:pwa-register').then(({ registerSW }: { registerSW: (options: Record<string, unknown>) => void }) => {
    registerSW({
      immediate: true,
      onRegistered(registration: ServiceWorkerRegistration | undefined) {

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => registration.update())
      .catch((error: unknown) => {

      
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
