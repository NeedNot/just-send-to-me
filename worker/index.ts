import { app } from './hono';
import { UserCreditsObject } from './durable-objects/user-credits-object';
import { FolderFlow } from './workflows/folder-flow';
import { FolderUploadsObject } from './durable-objects/folder-uploads-object';

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;

export { UserCreditsObject, FolderFlow, FolderUploadsObject };
