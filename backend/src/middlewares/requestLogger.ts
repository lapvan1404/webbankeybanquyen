import morgan from 'morgan';
import type { Request, Response } from 'express';

export const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message: string) => process.stdout.write(message),
    },
  },
);
