const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'VoiceBridge API',
    version: '1.0.0',
    description: 'API documentation for the VoiceBridge backend, providing endpoints for third-party webhooks and core application logic.',
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 3000}/v1`,
      description: 'Development server',
    },
  ],
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions (JSDoc comments)
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec; 