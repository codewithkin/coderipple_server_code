import express from 'express';
import morgan from 'morgan';
import buildRoutes from './routes/buildRoutes.js';
import { Server } from "socket.io";
import  { createServer } from "node:http";
import automateBuild from "./automate.js";
import cors from "cors";
const app = express();

// Middleware
app.use(express.json()); // For parsing JSON request bodies
app.use(morgan('dev')); // For logging HTTP requests
const server = createServer(app);
const io = new Server(server, { cors: {
    origin: "http://localhost:3000", // Replace with specific client origin
    methods: ["GET", "POST"],       // HTTP methods to allow
    credentials: true               // Allow cookies if needed
  }});

app.use(cors());

io.on("connection", (socket) => {
  console.log("A user connected");

socket.on("hello", (data) => console.log(data));

  socket.on("build", async (data) => {
   const { appName, repoUrl, appId } = data;
   console.log(data);
   console.log("Build started...");
   const localDir = `../projects/project_${Date.now()}`; // Create a unique directory for this build

  try {
    console.log(`Starting build for ${appName} (${appId})...`);
    await automateBuild({ repoUrl, appName, appId, localDir });
    console.log(`Build completed for ${appName} (${appId}).`);

    console.log({
      success: true,
      message: `Build completed successfully for ${appName}.`,
    });
  } catch (error) {
    console.error(`Build failed for ${appName} (${appId}):`, error.message);
    console.log({
      success: false,
      error: `Build failed: ${error.message}`,
    });
  }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Routes
app.use('/api/build', buildRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
