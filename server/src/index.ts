import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { config } from './config.js';
import { setupSocketHandlers } from './socketHandlers.js';

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

interface HealthResponse {
  status: 'ok';
}

app.get('/health', (_req: Request, res: Response<HealthResponse>) => {
  res.json({ status: 'ok' });
});

// Set up all socket event handlers
setupSocketHandlers(io);

httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
});

export { app, io, httpServer };
