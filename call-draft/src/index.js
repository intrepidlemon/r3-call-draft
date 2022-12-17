import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { EngineProvider } from './engine/context'
import Calendar from './components/calendar'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <EngineProvider>
      <Calendar/>
    </EngineProvider>
  </React.StrictMode>
)
