import { Router } from 'express';
import {
  createProjectCommentHandler,
  createProjectHandler,
  getSharedProjectHandler,
  publishProjectHandler,
} from '../controllers/project-controller.js';

const router = Router();

router.post('/api/projects', createProjectHandler);
router.post('/api/projects/:id/comments', createProjectCommentHandler);
router.post('/api/projects/:id/publish', publishProjectHandler);
router.get('/api/projects/share/:token', getSharedProjectHandler);

export default router;
