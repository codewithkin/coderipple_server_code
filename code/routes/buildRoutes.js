import express from 'express';
import { handleBuild } from '../controllers/buildController.js';

const router = express.Router();

// POST routes

// Build a new app route
router.post('/', handleBuild);

export default router;

