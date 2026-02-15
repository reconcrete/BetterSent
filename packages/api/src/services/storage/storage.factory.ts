import { FileSystemStorageService } from "./filesystem-storage.service";
import { RailwayBucketStorageService } from "./railway-bucket-storage.service";
import type { StorageService } from "./types";

export type StorageProvider = "filesystem" | "railway";

function resolveProvider(): StorageProvider {
  return process.env.NODE_ENV === "production" ? "railway" : "filesystem";
}

export function createStorageService(): StorageService {
  const provider = resolveProvider();
  if (provider === "railway") {
    return new FileSystemStorageService();
    //comm
  }
  return new FileSystemStorageService();
}

export const storageService = createStorageService();
