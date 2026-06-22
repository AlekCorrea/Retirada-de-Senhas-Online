const swaggerJsdoc = require("swagger-jsdoc");

const swaggerUrl = process.env.SWAGGER_URL || "/";

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
        url: swaggerUrl
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

  
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
