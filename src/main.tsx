import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { initializeAppIcons } from './utils/generateAppIcons';

import { LanguageProvider } from './i18n/LanguageContext';

// Initialize dynamic official WHOOP icons
initializeAppIcons();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
