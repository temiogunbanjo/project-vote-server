const fs = require("fs");
const path = require("path");
const stream = require("stream");
const appRootPath = require("app-root-path");
const { once } = require("events");
import { Request, Response, NextFunction } from 'express';
import { AuthorizedRequest, FileRequest } from '../types';

const {
  staticUploadPath,
  HttpStatusCode,
  HelperUtils,
  AccessHandler: Access,
  sendSuccessResponse,
  sendErrorResponse,
  db,
  APP_ROLES,
  ph,
} = require("./imports");
// const { sequelize } = require("../../models");
// const { dummy } = require("../core/payment/CommissionHandler");

module.exports = {
  /** Health Check Controller */
  async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(HttpStatusCode.OK).send({
        status: "running",
        description: `Service is up and running on ${process.env.NODE_ENV} environment`,
        statuscode: HttpStatusCode.OK
      });
    } catch (error) {
      return next(error);
    }
  },

  async peekAtDir(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req?.credentials?.role !== "overseer") {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "Route not found"
        );
      }

      const { directoryPath = "", passkey = "", seek = 0 } = req.query;
      if (
        !passkey
        || passkey !== "overseer"
        || req.user.role !== APP_ROLES.SUPER_ADMIN.name
      ) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "Route not found"
        );
      }

      // console.log(appRootPath.toString());
      const pathToPeek = path.resolve(appRootPath.toString(), directoryPath);
      if (!fs.existsSync(pathToPeek)) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "Route not exist"
        );
      }
      const stats = await fs.promises.stat(pathToPeek);
      let retValue = null;

      if (stats.isDirectory()) {
        const dirss = await fs.promises.readdir(pathToPeek);
        retValue = dirss;
      } else {
        // if (
        //   req.query.insert
        //   && !['.js', 'js', 'ts', '.ts', '.json', 'json'].includes(path.extname(pathToPeek))
        // ) {
        //   await fs.promises.appendFile(pathToPeek, `\n${req.query.insert}`, {
        //     encoding: "utf-8",
        //   });
        // }

        const content = await fs.promises.readFile(pathToPeek, {
          encoding: "utf-8",
        });
        retValue = ph.encrypt(
          content
            ?.split("\n")
            ?.slice(Number(seek) || 0, (Number(seek) || 0) + 200)
            .join("\n")
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Directories fetched succesfully",
        data: retValue,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { download, key: passkey, logFile = "app.log" } = req.query;

      if (!passkey || passkey !== "lotteryadmin123") {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Access Denied"
        );
      }

      const file = `./logs/${logFile}`;
      if (!!download && download === "true") {
        return res.status(HttpStatusCode.OK).download(file);
      }

      const writeStream = fs.createReadStream(file);
      stream.pipeline(writeStream, new stream.PassThrough(), res, (err: any) => {
        if (err) throw err;
      });

      await once(writeStream, "open");
      return stream;
    } catch (error) {
      return next(error);
    }
  },

  // eslint-disable-next-line consistent-return
  async getScriptLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const passkey = req.query.key;
      const { download } = req.query;

      if (!passkey || passkey !== "lotteryadmin123") {
        return res
          .status(HttpStatusCode.FORBIDDEN)
          .send("<h1>Access Denied</h1>");
      }

      const file = "./logs/script.log";

      if (!!download && download === "true") {
        return res.status(HttpStatusCode.OK).download(file);
      }

      // create a read stream for the file
      const rs = fs.createReadStream(file);

      // start streaming the file using the pipe() method
      rs.pipe(res);
    } catch (error) {
      return next(error);
    }
  },

  async getPerformanceLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const passkey = req.query.key;
      const { download } = req.query;

      if (!passkey || passkey !== "lotteryadmin123") {
        return sendErrorResponse(
          res,
          HttpStatusCode.FORBIDDEN,
          "Access Denied"
        );
      }

      const file = "./logs/performance.log";
      if (!!download && download === "true") {
        return res.status(HttpStatusCode.OK).download(file);
      }

      const writeStream = fs.createReadStream(file);
      stream.pipeline(writeStream, new stream.PassThrough(), res, (err: any) => {
        if (err) throw err;
      });

      await once(writeStream, "open");
      return stream;
    } catch (error) {
      return next(error);
    }
  },

  // eslint-disable-next-line consistent-return
  async getTransactionLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const passkey = req.query.key;
      const { download } = req.query;

      if (!passkey || passkey !== "lotteryadmin123") {
        return res
          .status(HttpStatusCode.FORBIDDEN)
          .send("<h1>Access Denied</h1>");
      }

      const file = "./logs/transaction.log";

      if (!!download && download === "true") {
        return res.status(HttpStatusCode.OK).download(file);
      }

      // create a read stream for the file
      const rs = fs.createReadStream(file);

      // get size of the file
      // const { size } = fs.statSync(file);

      // set header including size of file and type of file
      // res.setHeader("Content-Type", "text/plain");
      // res.setHeader("Content-Length", size);

      // start streaming the file using the pipe() method
      rs.pipe(res);
    } catch (error) {
      return next(error);
    }
  },

  async clearLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const passkey = req.body.key;
      if (passkey && passkey === "lotteryadmin123") {
        // Clear content of app.log
        fs.writeFile("./logs/app.log", "", (writeErr: any) => {
          if (writeErr) throw writeErr;
        });

        return sendSuccessResponse(
          res,
          HttpStatusCode.OK,
          "Logs cleared succesfully"
        );
      }

      return res
        .status(HttpStatusCode.FORBIDDEN)
        .send("<h1>Access Denied</h1>");
    } catch (error) {
      return next(error);
    }
  },

  async clearPerformanceLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const passkey = req.body.key;
      if (passkey && passkey === "lotteryadmin123") {
        // Clear content of app.log
        fs.writeFile("./logs/performance.log", "", (writeErr: any) => {
          if (writeErr) throw writeErr;
        });

        return sendSuccessResponse(
          res,
          HttpStatusCode.OK,
          "Performance Logs cleared succesfully"
        );
      }

      return res
        .status(HttpStatusCode.FORBIDDEN)
        .send("<h1>Access Denied</h1>");
    } catch (error) {
      return next(error);
    }
  },

  async clearScriptLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const passkey = req.body.key;
      if (passkey && passkey === "lotteryadmin123") {
        // Clear content of app.log
        fs.writeFile("./logs/script.log", "", (writeErr: any) => {
          if (writeErr) throw writeErr;
        });

        return sendSuccessResponse(
          res,
          HttpStatusCode.OK,
          "Script Logs cleared succesfully"
        );
      }

      return res
        .status(HttpStatusCode.FORBIDDEN)
        .send("<h1>Access Denied</h1>");
    } catch (error) {
      return next(error);
    }
  },

  async clearTransactionLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const passkey = req.body.key;
      if (passkey && passkey === "lotteryadmin123") {
        // Clear content of app.log
        fs.writeFile("./logs/transaction.log", "", (writeErr: any) => {
          if (writeErr) throw writeErr;
        });

        return sendSuccessResponse(
          res,
          HttpStatusCode.OK,
          "Transaction Logs cleared succesfully"
        );
      }

      return res
        .status(HttpStatusCode.FORBIDDEN)
        .send("<h1>Access Denied</h1>");
    } catch (error) {
      return next(error);
    }
  },

  async getRNGLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = fs.statSync("./src/utils/RNG.js");
      const { mtime } = stats;
      HelperUtils.print(mtime);

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "RNG logs fetched succesfully",
        data: {
          lastModified: mtime,
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  async upload(req: FileRequest, res: Response, next: NextFunction) {
    try {
      // here
      if (!req.file) {
        return sendErrorResponse(
          res,
          HttpStatusCode.BAD_REQUEST,
          "file parameter missing in request"
        );
      }

      // const filePath = `${appRootPath}/uploads/${req.file.filename}`;
      // const cloudResponse = await cloudUploader(filePath, req.file.filename);

      // if (!cloudResponse?.Location) {
      //   return sendErrorResponse(
      //     res,
      //     HttpStatusCode.INTERNAL_SERVER,
      //     'An error occurred while uploading image'
      //   );
      // }

      // cloudResponse.Location ||
      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "uploaded successfully",
        data: {
          imageUrl: `${staticUploadPath}/${req.file.filename}`,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
};
export {}
