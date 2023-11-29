import { Errback, NextFunction, Request, Response } from "express";

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const morgan = require("morgan");

const indexRouter = require("./routes");

const ErrorHandler = require("./error-helpers/ErrorHandler");
const HttpStatusCode = require("./error-helpers/Statuscode");
const { print } = require("./utils/HelperUtils");

// logs with wiston
const wiston = require("./error-helpers/WistonLogger");

const swaggerDocument = require("../swagger.json");

const app = express();

// app.use(expressMonitor());
// Add stream option to morgan
app.use(morgan("combined", { stream: wiston.stream }));
// app.use(pino());
app.use(
  express.json({
    limit: "50mb",
  })
);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS allow middleware
app.options("*", cors());
app.use(cors());

app.use("/static", express.static(path.join(__dirname, "..", "uploads")));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/v1", indexRouter);

// catch 404 and forward to error handler
app.all("/*", (req: Request, res: Response & { message?: string }) => {
  wiston.error(
    `404 -${res.message || "Route not found"} - ${req.originalUrl} - ${
      req.method
    } - ${req.ip}`
  );
  res.status(404).send({
    status: "error",
    error: "This route is unavailable on this server",
  });
});

// get the unhandled rejection and throw it to another fallback handler we already have.
// eslint-disable-next-line no-unused-vars
process.on("unhandledRejection", (error, _promise) => {
  throw error;
});

// handle any uncaught exceptions
process.on("uncaughtException", (error) => {
  print(error, { type: "fatal", logging: true });
  ErrorHandler.handleError(error);
  if (!ErrorHandler.isTrustedError(error)) {
    process.exit(1);
  }
});

// error handler
app.use(
  async (
    err: Errback & { status: string },
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    // eslint-disable-next-line no-console
    console.log(err);
    if (err instanceof Error) {
      wiston.error(
        `${err.status || HttpStatusCode.INTERNAL_SERVER} - ${err.message} - ${
          req.originalUrl
        } - ${req.method} - ${req.ip}`
      );

      if (ErrorHandler.isTrustedError(err)) {
        return ErrorHandler.handleTrustedError(err, res);
      }

      if (ErrorHandler.isAxiosError) {
        return ErrorHandler.handleAxiosError(err, res);
      }

      // what do we do when error is not operational
      return ErrorHandler.handleGeneralErrors(err, res);
    }

    return next(err);
  }
);

module.exports = app;
export {};
