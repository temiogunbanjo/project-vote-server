import { Request } from 'express';

interface AuthorizedRequest extends Request {
  user?: { role: string };
  credentials?: { role: string }
}

interface FileRequest extends Request {
  file?: any;
}

export { AuthorizedRequest, FileRequest };
