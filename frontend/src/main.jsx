import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.addEventListener('error', (e) => {
  document.getElementById('root').innerHTML = `
    <div style="padding: 40px; background: #220000; color: #ff8888; height: 100vh;">
      <h1>UI Crash Detected!</h1>
      <h3>Error: ${e.message}</h3>
      <pre style="white-space: pre-wrap; font-size: 14px;">${e.error?.stack}</pre>
    </div>
  `;
});

window.addEventListener('unhandledrejection', (e) => {
  document.getElementById('root').innerHTML = `
    <div style="padding: 40px; background: #220000; color: #ff8888; height: 100vh;">
      <h1>UI Promise Crash Detected!</h1>
      <h3>Error: ${e.reason?.message || e.reason}</h3>
      <pre style="white-space: pre-wrap; font-size: 14px;">${e.reason?.stack}</pre>
    </div>
  `;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
