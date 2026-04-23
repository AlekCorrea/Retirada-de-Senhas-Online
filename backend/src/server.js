require("dotenv").config();

const app = require("./app");

const passport = require("passport");
require("./config/passport");

const authRoutes = require("./routes/authRoutes");

// middlewares
app.use(passport.initialize());

// rotas
app.use("/auth", authRoutes);

// porta
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});