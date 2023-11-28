import { Media } from "./media.ts";

export function deleteMedia(deletes: Media[]): void {
  deletes.forEach((media) => {
    const path = buildFilePath(media);
    const cmd = `rm "${path}"`;
    console.log(cmd);
  });
}

function buildFilePath(media: Media): string {
  const localPath = media.file.replace("/home/daniel/media", "");
  const dropboxPath = "/home/daniel/dropbox-crypt";
  return dropboxPath + localPath;
}
