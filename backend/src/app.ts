import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import routes from './routes/index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middlewares
app.use(helmet()); // Secure HTTP headers

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin 
    // (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    const isLocalIP = origin.startsWith('http://192.168.') || origin.startsWith('http://10.') || origin.startsWith('http://172.');
    
    if (allowedOrigins.indexOf(origin) !== -1 || isLocalhost || isLocalIP) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: { success: false, message: 'Muitas requisições, tente novamente mais tarde.' },
});
app.use('/api', globalLimiter);

// Strict Rate Limiting for Auth
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each IP to 100 auth requests per hour
  message: { success: false, message: 'Muitas tentativas de login, tente novamente em uma hora.' },
});
app.use('/api/auth', authLimiter);

// Routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Kaptal Backend Server
━━━━━━━━━━━━━━━━━━━━━━━
📍 Server running at: http://localhost:${PORT}
📝 API prefix: /api
🔐 Auth routes: /api/auth
━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

export default app;
