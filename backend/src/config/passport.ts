const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db = require("./db");

const montarUsuarioGoogle = (usuario) => ({
    id: usuario.id,
    googleId: usuario.google_id,
    nome: usuario.nome,
    email: usuario.email,
    foto: usuario.foto_url,
    foto_url: usuario.foto_url,
    perfil: "cliente"
});

const salvarUsuarioGoogle = async (profile) => {
    const email = profile.emails?.[0]?.value;

    if (!email) {
        throw new Error("Conta Google sem email publico");
    }

    const nome = profile.displayName || email;
    const fotoUrl = profile.photos?.[0]?.value || null;

    const result = await db.query(
        `
            WITH usuario_existente AS (
                SELECT id
                FROM usuarios
                WHERE google_id = $1 OR email = $2
                ORDER BY
                    CASE WHEN google_id = $1 THEN 0 ELSE 1 END,
                    id ASC
                LIMIT 1
            ),
            usuario_atualizado AS (
                UPDATE usuarios
                SET google_id = $1,
                    nome = $3,
                    email = $2,
                    foto_url = $4,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = (SELECT id FROM usuario_existente)
                RETURNING id, google_id, nome, email, foto_url, created_at, updated_at
            ),
            usuario_inserido AS (
                INSERT INTO usuarios (google_id, nome, email, foto_url)
                SELECT $1, $3, $2, $4
                WHERE NOT EXISTS (SELECT 1 FROM usuario_atualizado)
                ON CONFLICT (google_id) DO UPDATE
                SET nome = EXCLUDED.nome,
                    email = EXCLUDED.email,
                    foto_url = EXCLUDED.foto_url,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id, google_id, nome, email, foto_url, created_at, updated_at
            )
            SELECT * FROM usuario_atualizado
            UNION ALL
            SELECT * FROM usuario_inserido
            LIMIT 1
        `,
        [profile.id, email, nome, fotoUrl]
    );

    return montarUsuarioGoogle(result.rows[0]);
};

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "seu_google_client_id_aqui",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "seu_google_client_secret_aqui",
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://127.0.0.1/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const usuario = await salvarUsuarioGoogle(profile);
        return done(null, usuario);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

module.exports = passport;
