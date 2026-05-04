const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Backend rodando\n");
});

server.listen(3000, () => {
  console.log("Backend rodando na porta 3000");
});
``