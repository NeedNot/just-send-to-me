export type BaseEntity = {
  id: string;
  createdAt: number;
};

export type Entity<T> = {
  [K in keyof T]: T[K];
} & BaseEntity;

export type Folder = Entity<{
  name: string;
  maxSize: number;
  expiresAt: Date;
  deletesAt: Date;
  files: File[];
  isOwnFolder: boolean;
}>;

export type File = Entity<{ name: string; folderId: string; size: number }>;
