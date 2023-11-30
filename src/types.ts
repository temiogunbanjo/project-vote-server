import { Request } from 'express';

interface AuthorizedRequest extends Request {
  user?: { role: string };
  credentials?: { role: string }
}

interface FileRequest extends Request {
  file?: any;
}

type QueryFilter = {
  page: Number;
  limit: Number;
  from: string | Date;
  order: string[]; // Sort by latest
}

export { AuthorizedRequest, FileRequest, QueryFilter };
