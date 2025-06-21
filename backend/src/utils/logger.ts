import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export const logError = (message: string, error: any) => {
  logger.error(message, {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
};

export const logInfo = (message: string, data?: any) => {
  logger.info(message, {
    data,
    timestamp: new Date().toISOString()
  });
};

export const logWarning = (message: string, data?: any) => {
  logger.warn(message, {
    data,
    timestamp: new Date().toISOString()
  });
};

export const logSubscriptionEvent = (event: string, data: any) => {
  logger.info(`Subscription Event: ${event}`, {
    event,
    data,
    timestamp: new Date().toISOString()
  });
};

export default logger; 