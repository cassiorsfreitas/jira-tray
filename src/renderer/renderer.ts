import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { App } from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(createElement(App));
