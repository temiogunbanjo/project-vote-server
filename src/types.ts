import { Request } from "express";

interface AuthorizedRequest extends Request {
  user?: { role: string };
  credentials?: { role: string };
}

interface FileRequest extends Request {
  file?: any;
}

type QueryFilter = {
  page: number;
  limit: number;
  from: string | Date;
  order: string[]; // Sort by latest
};

type GenericObject = {
  [x: string]: any;
};

export { AuthorizedRequest, FileRequest, QueryFilter, GenericObject };
