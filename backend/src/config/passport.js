const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "seu_google_client_id_aqui",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "seu_google_client_secret_aqui",
    callbackURL: "/auth/google/callback"
},
(accessToken, refreshToken, profile, done) => {
    const usuario = {
        googleId: profile.id,
        nome: profile.displayName,
        email: profile.emails[0].value,
        foto: profile.photos[0]?.value
    };

    return done(null, usuario);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

module.exports = passport;
