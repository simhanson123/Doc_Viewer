import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

// Never import iconv-lite / Node Buffer in the renderer —
// they pull `require()` into the ESM bundle and blank the whole UI.

const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.innerHTML =
    '<pre style="padding:24px;font:14px monospace">Onjeom: #root missing</pre>';
} else {
  try {
    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    document.documentElement.style.setProperty('font-family', 'var(--font-ui)');
  } catch (err) {
    const msg = err instanceof Error ? err.stack || err.message : String(err);
    rootEl.innerHTML = `<pre style="padding:24px;font:13px/1.4 monospace;white-space:pre-wrap;color:#900">Onjeom failed to start:\n\n${msg}</pre>`;
    console.error('[onjeom] boot failed', err);
  }
}
