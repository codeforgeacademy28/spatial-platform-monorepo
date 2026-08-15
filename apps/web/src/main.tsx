import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css'; // <-- REQUIRED for Tailwind to load
import { App } from './App.js';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);