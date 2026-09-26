import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AudioVisualizerPage } from './standalone/AudioVisualizerPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AudioVisualizerPage />
  </StrictMode>,
)
