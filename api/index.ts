import type { Request, Response } from 'express';
import app from '../server.js';

export default function handler(req: Request, res: Response) {
  try {
    return (app as any)(req, res);
  } catch (err: any) {
    console.error('Serverless function invocation error:', err);
    return res.status(500).json({ error: 'Serverless execution error', message: err?.message, stack: err?.stack });
  }
}
