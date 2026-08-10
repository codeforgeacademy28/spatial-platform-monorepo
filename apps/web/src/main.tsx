import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { SpatialCanvas } from './components/SpatialCanvas';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SpatialCanvas />
  </React.StrictMode>,
);
