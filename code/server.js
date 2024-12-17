import express from 'express';
import morgan from 'morgan';
import buildRoutes from './routes/buildRoutes.js';
import { createServer } from "node:http";
import cors from "cors";
import {config} from "dotenv";

// Allow Parsing of environment variables
config()

const app = express();

// Middleware
app.use(express.json()); // For parsing JSON request bodies
app.use(morgan('dev')); // For logging HTTP requests
const server = createServer(app);

app.use(cors());
app.timeout = 100000;

// Routes
app.use('/api/apps/build', buildRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});


// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
