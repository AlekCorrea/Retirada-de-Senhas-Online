const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
  openapi: "3.0.0",

  info: {
    title: "API - Retirada de Senhas Online",
    version: "1.0.0",
    description: "Documentação da API"
  },

  servers: [
    {
      url: "http://localhost:3000"
    }
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  }
},

  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;