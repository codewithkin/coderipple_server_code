import express from 'express';
import morgan from 'morgan';
import buildRoutes from './routes/buildRoutes.js';
import { Server } from "socket.io";
import { createServer } from "node:http";
import automateBuild from "./automate.js";
import cors from "cors";
import {config} from "dotenv";

// Allow Parsing of environment variables
config()

const app = express();

// Middleware
app.use(express.json()); // For parsing JSON request bodies
app.use(morgan('dev')); // For logging HTTP requests
const server = createServer(app);
const io = new Server(server, { cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"], // Replace with specific client origin
    methods: ["GET", "POST"],       // HTTP methods to allow
    credentials: true               // Allow cookies if needed
}});

app.use(cors());
app.timeout = 100000;
io.on("connection", (socket) => {
console.log("A user connected");

socket.on("hello", (data) => console.log(data));

  socket.on("build", async (data) => {
   const { appName, repoUrl, appId, appDescription, webAppUrl, appType, framework, packageManager, buildCommand } = data;
   console.log(data);
   console.log("Build started...");

  try {
    const signedApkUrl = await automateBuild({ repoUrl, appName, appId, framework, appType, packageManager, buildCommand });

    console.log({
      success: true,
      message: `Build completed successfully for ${appName}.`,
    });

    // Upload the resulting file to Linode
    await uploadFile(signedApkUrl);

    socket.emit("newapp",  // Create a new app entry in the database
        {
          appName,
          dateCreated: new Date(),
          apkUrl: signedApkUrl,
          appIconUrl: `http://localhost:3001/${appName}/icon.png`,
          appDescription,
          webAppUrl
    });

    } catch (error) {
      console.error(`Build failed for ${appName} (${appId}):`, error.message);
      console.log({
        success: false,
        error: `Build failed: ${error.message}`,
      });

      socket.emit("error", `An error occured: ${error.message}`)
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
