import { Buffer } from 'buffer';
// iconv-lite needs Buffer in the renderer
(globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

document.documentElement.style.setProperty('font-family', 'var(--font-ui)');
