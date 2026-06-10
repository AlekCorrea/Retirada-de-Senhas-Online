const bcrypt = require("bcryptjs");

const BCRYPT_ROUNDS = 10;

const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$/.test(value || "");

const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

const verifyPassword = async (plainPassword, storedPassword) => {
    if (isBcryptHash(storedPassword)) {
        return bcrypt.compare(plainPassword, storedPassword);
    }

    return plainPassword === storedPassword;
};

module.exports = {
    hashPassword,
    isBcryptHash,
    verifyPassword
};
