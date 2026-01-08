import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { config } from './config.js';
import { setupSocketHandlers } from './socketHandlers.js';
import {
  generateAvatar,
  isValidStyle,
  AVATAR_STYLES,
} from './geminiAvatar.js';

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

// Avatar generation types
interface AvatarGenerateRequest {
  photoBase64: string;
  style: string;
}

interface AvatarGenerateResponse {
  success: boolean;
  imageBase64?: string;
  error?: string;
}

// Avatar generation endpoint
app.post('/api/avatar/generate', (req: Request<object, AvatarGenerateResponse, AvatarGenerateRequest>, res: Response<AvatarGenerateResponse>) => {
  const { photoBase64, style } = req.body;

  // Validate required fields
  if (!photoBase64 || typeof photoBase64 !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Missing or invalid photoBase64',
    });
    return;
  }

  if (!style || typeof style !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Missing or invalid style',
    });
    return;
  }

  // Validate style
  if (!isValidStyle(style)) {
    res.status(400).json({
      success: false,
      error: `Invalid style. Must be one of: ${AVATAR_STYLES.join(', ')}`,
    });
    return;
  }

  // Generate avatar
  generateAvatar(photoBase64, style)
    .then((result) => {
      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error ?? 'Avatar generation failed',
        });
        return;
      }

      res.json({
        success: true,
        imageBase64: result.imageBase64,
      });
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        error: message,
      });
    });
});

// Set up all socket event handlers
setupSocketHandlers(io);

httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
});

export { app, io, httpServer };
