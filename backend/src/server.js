require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const apiRoutes = require('./routes');
const bodyParser = require('body-parser');

const app = express();

// Use morgan for HTTP request logging
app.use(morgan('combined'));

// Use express.json() for all routes except Stripe webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/v1/webhooks/stripe') {
    next(); // skip express.json for Stripe webhook
  } else {
    express.json()(req, res, next);
  }
});

// Stripe webhook route (use raw body)
app.post('/v1/webhooks/stripe', bodyParser.raw({ type: 'application/json' }), require('./controllers/stripe.controller').handleStripeWebhook);

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('VoiceBridge Backend is running.');
});

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes under /v1
app.use('/v1', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
}); 