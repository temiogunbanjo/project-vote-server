const fs = require("fs");
const path = require("path");
const stream = require("stream");
const appRootPath = require("app-root-path");
import { Request, Response, NextFunction } from "express";
import Category, { Availability } from "../schemas/CategorySchema";
// import { AuthorizedRequest, FileRequest } from '../types';

const {
  HelperUtils,
  HttpStatusCode,
  sendSuccessResponse,
  sendErrorResponse,
  db,
} = require("./imports");

module.exports = {
  async fetchSingleCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const { campaignId } = req.params;
      const dbResponse = await db.fetchOneEvent(campaignId);

      if (!dbResponse) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "No such campaign"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Campaign retrieved successfully",
        payload: dbResponse,
      });
    } catch (error) {
      return next(error);
    }
  },

  async fetchAllCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = HelperUtils.mapAsFilter(req.query);
      const dbResponse = await db.fetchAllEvents(filters);

      if (!dbResponse) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "No campaigns yet"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Campaigns retrieved successfully",
        payload: dbResponse,
      });
    } catch (error) {
      return next(error);
    }
  },

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description = "", campaignId } = req.body;

      const newCategory = new Category(
        name,
        description,
        campaignId,
        Availability.EVERYONE
      );
      const dbResponse = await db.createCategory(newCategory);

      if (!dbResponse) {
        return sendErrorResponse(res, HttpStatusCode.BAD_REQUEST, "Failed");
      }

      return sendSuccessResponse(res, HttpStatusCode.CREATED, {
        message: "Category created successfully",
        payload: dbResponse,
      });
    } catch (error) {
      return next(error);
    }
  },

  async fetchCampaignCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const filters = HelperUtils.mapAsFilter(req.query);
      const { campaignId } = req.params;
      const dbResponse = await db.fetchAllCategories(campaignId, filters);

      if (!dbResponse) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "No categories yet"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Categories retrieved successfully",
        payload: dbResponse,
      });
    } catch (error) {
      return next(error);
    }
  },

  async fetchAllCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = HelperUtils.mapAsFilter(req.query);
      const dbResponse = await db.fetchAllCategories(filters);

      if (!dbResponse) {
        return sendErrorResponse(
          res,
          HttpStatusCode.NOT_FOUND,
          "No categories yet"
        );
      }

      return sendSuccessResponse(res, HttpStatusCode.OK, {
        message: "Categories retrieved successfully",
        payload: dbResponse,
      });
    } catch (error) {
      return next(error);
    }
  },
};
export {};
