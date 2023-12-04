import { existsSync } from "https://deno.land/std/fs/mod.ts";
import { Media, MediaType } from "./media.ts";

const LOCAL_PATH = "/home/daniel/media";
const REMOTE_PATH = "/home/daniel/dropbox-crypt";

export function printDeleteMediaFileCommand(deletes: Media[]): void {
  deletes.forEach((media) => {
    const path = buildFilePath(media);
    const cmd = `rm "${path}"`;
    console.log(cmd);
  });
}

export function executeDeleteMediaFolder(media: Media): void {
  if (!media.name || media.name.length < 2) throw Error(`Invalid media ${JSON.stringify(media)}`);

  // delete from filesystem first
  const mediaFolder = media.type == MediaType.MOVIE ? "Movies" : "TV Shows";
  const path = REMOTE_PATH + "/" + mediaFolder + "/" + media.name + "/";
  if (existsSync(path)) {
    // Deno.removeSync(path, { recursive: true });
    console.log(`[FILESYSTEM] DELETED: ${path}`);
  } else {
    console.log(`[FILESYSTEM] NOT FOUND: ${path}`);
  }
}

function buildFilePath(media: Media): string {
  const localPath = media.file.replace(LOCAL_PATH, "");
  const dropboxPath = REMOTE_PATH;
  return dropboxPath + localPath;
}
