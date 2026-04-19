import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { HttpError } from './lib/http-error.js';
import { router } from './routes/ledger-routes.js';

export const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
  }),
);
app.use(express.json());
app.use(router);

app.use((request, _response, next) => {
  next(new HttpError(404, `Route '${request.originalUrl}' was not found.`));
});

app.use((error, _request, response, _next) => {
  const statusCode = error.statusCode ?? 500;
  const message = error.message ?? 'An unexpected error occurred.';

  response.status(statusCode).json({
    statusCode,
    message,
    details: error.details ?? null,
  });
});
