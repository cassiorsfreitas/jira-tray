import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { App } from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(createElement(App));

window.electronAPI.onWindowShow(() => {
  const appContainer = document.querySelector<HTMLElement>('.app-container');
  if (appContainer) {
    appContainer.style.animation = 'none';
    void appContainer.offsetHeight; // trigger reflow to restart animation
    appContainer.style.animation = '';
  }
});
