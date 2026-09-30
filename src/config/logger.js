const winston = require('winston');
const path = require('path');
const { LOG_LEVEL, NODE_ENV } = require('./env');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf((info) => {
    return `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`;
  })
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      format
    )
  })
];

// In production or development (non-test), also log to files
if (NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format
    })
  );
}

const logger = winston.createLogger({
  level: LOG_LEVEL,
  levels,
  transports
});

module.exports = logger;
