// src/server.js
const app = require("./app");

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

require("dotenv").config();

const passport = require("passport");
require("./config/passport");

app.use(passport.initialize());

const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);