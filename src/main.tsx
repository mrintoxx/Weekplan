import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { injectThemeTokens } from './constants/theme';
import { initializeStore } from './store/useStore';
import './index.css';

// Inject Material 3 tokens into :root
injectThemeTokens();

// Best-effort async hydration — render follows immediately (Phase 2 will add Suspense)
void initializeStore();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
