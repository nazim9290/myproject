import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'

// ── Sentry — Frontend error monitoring ──
Sentry.init({
  dsn: "https://d92d5dcac2459f51d3a85926dfe01421@o4511123819331584.ingest.de.sentry.io/4511170807201872",
  environment: window.location.hostname === "localhost" ? "development" : "production",
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  enabled: window.location.hostname !== "localhost",
})

// Browser default drag-drop prevent — file drop করলে navigate হবে না
// DropZone component নিজে handle করবে
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
