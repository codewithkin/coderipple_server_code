import express from 'express';
import { handleBuild } from '../controllers/buildController.js';

const router = express.Router();

// POST /api/build
router.post('/', handleBuild);

export default router;

