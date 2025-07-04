import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
//Import Mixpanel SDK
import mixpanel from "mixpanel-browser";

// Near entry of your product, init Mixpanel
mixpanel.init('71205d4be193b8f0b9c7ad93b4b08d57', {
  debug: true,
  track_pageview: true,
  persistence: "localStorage",
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
