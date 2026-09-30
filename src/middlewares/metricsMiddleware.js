const promClient = require('prom-client');

// Initialize default system metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register, prefix: 'devops_app_' });

// HTTP request counter
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// HTTP request duration histogram
const httpRequestDurationSeconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

// Express middleware to track requests
const metricsMiddleware = (req, res, next) => {
  // Ignore /metrics and /health from request duration histograms to avoid skewing
  if (req.path === '/metrics' || req.path === '/favicon.ico') {
    return next();
  }

  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const route = req.baseUrl + (req.route ? req.route.path : req.path);
    const statusCode = res.statusCode;

    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: statusCode
    });

    httpRequestDurationSeconds.observe(
      {
        method: req.method,
        route,
        status_code: statusCode
      },
      durationInSeconds
    );
  });

  next();
};

module.exports = {
  register,
  metricsMiddleware,
  httpRequestCounter,
  httpRequestDurationSeconds
};
