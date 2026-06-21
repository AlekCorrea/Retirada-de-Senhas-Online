const swaggerJsdoc = require("swagger-jsdoc");

// URL relativa: o Swagger UI resolve automaticamente para a mesma origem
// (host + porta) de onde a página /api-docs foi carregada.
// Funciona em http://localhost:3000/api-docs, http://localhost/api-docs, etc,
// sem precisar de variável de ambiente.
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