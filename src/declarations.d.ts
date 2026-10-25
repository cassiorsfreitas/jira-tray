/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

declare module '*.css';

interface Window {
  electronAPI: {
    quit: () => void;
    refresh: () => void;
  };
}
