import winston from 'winston';

// Logger simples que funciona no Vercel
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

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
