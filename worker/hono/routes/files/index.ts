import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppBindings, AppVariables } from '../../../lib/types';
import * as routes from './routes';
import * as handlers from './handlers';

export default new OpenAPIHono<AppBindings & AppVariables>()
  .openapi(routes.startUploaderSession, handlers.startUploaderSession)
  .openapi(routes.downloadFile, handlers.downloadFile)
  .openapi(routes.uploadNewFile, handlers.uploadNewFile)
  .openapi(routes.getFilePartUploadUrl, handlers.uploadFilePart)
  .openapi(routes.completeFileUpload, handlers.completeFileUpload)
  .openapi(routes.abortFileUpload, handlers.abortFileUpload);
