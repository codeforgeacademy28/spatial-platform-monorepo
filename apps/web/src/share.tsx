import React from 'react';
import ReactDOM from 'react-dom/client';
import { ProjectSchema } from '@spatial/core';
import './styles.css';
import { ShareViewer } from './components/ShareViewer.js';

const projectFromWindow = (window as typeof window & {
  __SPATIAL_PROJECT__?: unknown;
}).__SPATIAL_PROJECT__;

if (!projectFromWindow || typeof projectFromWindow !== 'object') {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;color:#e2e8f0;background:#020617;">Shared design unavailable.</div>';
  }
} else {
  const project = ProjectSchema.parse(projectFromWindow);

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <ShareViewer project={project} />
    </React.StrictMode>,
  );
}
