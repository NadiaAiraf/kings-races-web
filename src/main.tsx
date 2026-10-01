import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/shared/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      fallback={
        <div className="max-w-[430px] mx-auto px-4 py-8 text-center">
          <p className="text-sm text-slate-600">Something went wrong.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 min-h-11 px-4 text-sm font-semibold text-blue-600"
          >
            Reload
          </button>
        </div>
      }
    >
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
