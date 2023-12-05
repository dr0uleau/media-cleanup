import { LOCAL_PATH } from "./utils/filesystem.ts";
import { MediaType } from "./utils/media.ts";

export interface MediaManager {
  user: string;
  password: string;
  apiKey: string;

  deleteMedia(id: number, name: string): Promise<void>;
  getMediaNameToIdMap(): Promise<Map<string, number>>;
}

export function getMediaFolderFromPath(path: string, mediaType: MediaType): string {
  const mediaTypeFolder = mediaType == MediaType.TV ? "TV Shows/" : "Movies/";
  return path.replace(LOCAL_PATH + "/" + mediaTypeFolder, "");
}
