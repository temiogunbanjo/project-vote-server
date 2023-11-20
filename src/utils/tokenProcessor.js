const jwt = require("jsonwebtoken");
const hash = require("./hash");
require("dotenv").config();

module.exports = {
  verifyToken: (token) => jwt.verify(token, `${process.env.JWT_SECRET}`, {
    expiresIn: "1d",
    algorithms: ["HS256"],
  }),
  createToken: (payload) => jwt.sign(payload, `${process.env.JWT_SECRET}`, {
    expiresIn: "1d",
  }),
  verifyHashedToken: (token, expiresIn = "1d") => jwt.verify(hash.decrypt(token), `${process.env.JWT_SECRET}`, {
    expiresIn,
    algorithms: ["HS256"],
  }),
  createHashedToken: (payload, expiresIn = "1d") => hash.encrypt(
    jwt.sign(payload, `${process.env.JWT_SECRET}`, {
      expiresIn,
    })
  ),
};
