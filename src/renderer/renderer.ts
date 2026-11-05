import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { App } from './App';
import { SettingsApp } from './settings/SettingsApp';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

// The Popup and the Settings window share this bundle; the main process loads
// the Settings window with the `#settings` hash.
const isSettingsWindow = window.location.hash === '#settings';

createRoot(container).render(
  createElement(isSettingsWindow ? SettingsApp : App),
);
