const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const algorithm = 'aes-256-cbc';

module.exports = {
  encrypt: (password) => {
    const iv = crypto.randomBytes(16); // Generates a buffer
    const key = crypto.randomBytes(32);

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(password);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return `${iv.toString('hex')}h${encrypted.toString('hex')}h${key.toString('hex')}`;
  },
  decrypt: (encryptedpassword) => {
    let [iv, encrypted, key] = encryptedpassword.split('h');
    iv = Buffer.from(iv, 'hex');
    encrypted = Buffer.from(encrypted, 'hex');
    key = Buffer.from(key, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted);

    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  },
  encryptV2(passwordString) {
    const hash = bcrypt.hashSync(passwordString, 10);
    return hash;
  },
  compareHashAndString(hashedPasswordString, compareWith) {
    return bcrypt.compareSync(compareWith, hashedPasswordString);
  }
};
