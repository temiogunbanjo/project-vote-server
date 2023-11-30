const jwt = require("jsonwebtoken");
const hash = require("./hash");
require("dotenv").config();

module.exports = {
  verifyToken: (/** @type {string} */ token) => jwt.verify(token, `${process.env.JWT_SECRET}`, {
    algorithms: ["HS256"],
  }),
  createToken: (/** @type {any} */ payload) => jwt.sign(payload, `${process.env.JWT_SECRET}`, {
    expiresIn: "1d",
  }),
  verifyHashedToken: (/** @type {string} */ token) => jwt.verify(hash.decrypt(token), `${process.env.JWT_SECRET}`, {
    algorithms: ["HS256"],
  }),
  createHashedToken: (/** @type {any} */ payload, expiresIn = "1d") => hash.encrypt(
    jwt.sign(payload, `${process.env.JWT_SECRET}`, {
      expiresIn,
    })
  ),
};
