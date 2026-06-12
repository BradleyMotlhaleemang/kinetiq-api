import * as Sentry from '@sentry/nestjs';

const enabled = Boolean(process.env.SENTRY_DSN);

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment:
    process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
  release: process.env.SENTRY_RELEASE,
  enabled,
  tracesSampleRate:
    enabled && process.env.NODE_ENV === 'production' ? 0.1 : 0,
});
