const fs = require("fs");
const path = require("path");
const stream = require("stream");
const appRootPath = require("app-root-path");
const { once } = require("events");
import { Request, Response, NextFunction } from 'express';
// import { AuthorizedRequest, FileRequest } from '../types';

const {
  HelperUtils,
  HttpStatusCode,
  sendSuccessResponse,
  sendErrorResponse,
  db,
} = require("./imports");

module.exports = {
  async fetchAllCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = HelperUtils.mapAsFilter(req.query)
      const dbResponse = await db.fetchAllEvents(filters);

      if (!dbResponse) {
        return sendErrorResponse(res, HttpStatusCode.NOT_FOUND, 'No campaigns yet');
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Campaigns retrieved successfully",
        payload: dbResponse
      });
    } catch (error) {
      return next(error);
    }
  }
};
export {}
