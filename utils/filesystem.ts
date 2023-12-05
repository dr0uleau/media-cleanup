import { existsSync } from "https://deno.land/std/fs/mod.ts";
import { Media, MediaType } from "./media.ts";
import { dryRunLog } from "./dryrun.ts";

const LOCAL_PATH = "/home/daniel/media";
const REMOTE_PATH = "/home/daniel/dropbox-crypt";

export function printDeleteMediaFileCommand(deletes: Media[]): void {
  deletes.forEach((media) => {
    const path = buildFilePath(media);
    const cmd = `rm "${path}"`;
    console.log(cmd);
  });
}

export function executeDeleteMediaFolder(media: Media, dryrun: boolean): void {
  if (!media.name || media.name.length < 2) throw Error(`Invalid media ${JSON.stringify(media)}`);

  const mediaFolder = media.type == MediaType.MOVIE ? "Movies" : "TV Shows";
  const localFile = media.file.replace(LOCAL_PATH + "/" + mediaFolder + "/", "");
  const localFolder = localFile.split("/")[0];
  const remotePath = REMOTE_PATH + "/" + mediaFolder + "/" + localFolder + "/";
  if (existsSync(remotePath)) {
    if (!dryrun) Deno.removeSync(remotePath, { recursive: true });
    console.log(`${dryRunLog(dryrun)}[FILESYSTEM] DELETED: ${remotePath}`);
  } else {
    console.log(`${dryRunLog(dryrun)}[FILESYSTEM] NOT FOUND: ${remotePath}`);
  }
}

function buildFilePath(media: Media): string {
  const localPath = media.file.replace(LOCAL_PATH, "");
  const dropboxPath = REMOTE_PATH;
  return dropboxPath + localPath;
}
