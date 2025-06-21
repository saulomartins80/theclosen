import winston from 'winston';
import path from 'path';

const logDir = 'logs';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(logDir, 'error.log'), 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: path.join(logDir, 'combined.log') 
        }),
        new winston.transports.File({ 
            filename: path.join(logDir, 'subscription.log'),
            level: 'info'
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

export const logSubscriptionEvent = (event: string, data: Record<string, any>) => {
    console.log('Subscription Event:', {
        event,
        data,
        timestamp: new Date().toISOString()
    });
};

export const logError = (error: Error, context?: Record<string, any>) => {
    console.error('Error:', {
        message: error.message,
        stack: error.stack,
        context
    });
};

export default logger; 