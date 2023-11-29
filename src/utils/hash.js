const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const algorithm = 'aes-256-cbc';

module.exports = {
  /**
   *
   * @param {string} password
   * @returns {string}
   */
  encrypt: (password) => {
    const iv = crypto.randomBytes(16); // Generates a buffer
    const key = crypto.randomBytes(32);

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(password);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return `${iv.toString('hex')}h${encrypted.toString('hex')}h${key.toString('hex')}`;
  },
  /**
   *
   * @param {string} encryptedpassword
   * @returns {string}
   */
  decrypt: (encryptedpassword) => {
    const [iv, encrypted, key] = encryptedpassword.split('h');
    const bufferedIV = Buffer.from(iv, 'hex');
    const bufferedEncrypted = Buffer.from(encrypted, 'hex');
    const bufferedKey = Buffer.from(key, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, bufferedKey, bufferedIV);
    let decrypted = decipher.update(bufferedEncrypted);

    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  },
  /**
   *
   * @param {string} passwordString
   * @returns {string}
   */
  encryptV2(passwordString) {
    const hash = bcrypt.hashSync(passwordString, 10);
    return hash;
  },
  /**
   *
   * @param {string} hashedPasswordString
   * @param {string} compareWith
   * @returns {boolean}
   */
  compareHashAndString(hashedPasswordString, compareWith) {
    return bcrypt.compareSync(compareWith, hashedPasswordString);
  }
};
