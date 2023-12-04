import { MediaManager } from "../MediaManager.ts";
import { MovieManager } from "../MovieManager.ts";
import { ShowManager } from "../ShowManager.ts";
import { MediaType } from "../utils/media.ts";
import { parseCsvFile } from "../utils/csv.ts";
import { executeDeleteMediaFolder } from "../utils/filesystem.ts";

const filename = Deno.args[0];
const { mediaMap, type } = await parseCsvFile(filename);
const mediaManagerData = await getMediaManagerData(type);

for (const [title, medias] of mediaMap) {
  if (medias.length > 1) throw Error(`Media with duplicates! ${title}`);

  const media = medias[0];
  if (media.skip == null || media.skip == undefined)
    throw Error(`Invalid media ${JSON.stringify(media)}`);
  if (media.skip.length > 0) {
    // console.log(`[SKIP] ${media.name}`);
    continue;
  }

  executeDeleteMediaFolder(media);

  const mediaId = mediaManagerData.mediaMap.get(media.name);
  if (!mediaId) {
    console.log(`[MEDIA MANAGER] NOT FOUND: ${media.name}`);
  } else {
    // await mediaManagerData.mediaManager.deleteMedia(mediaId, media.name);
    console.log(`[MEDIA MANAGER] DELETED: ${media.name}`);
  }
}

interface MediaManagerData {
  mediaManager: MediaManager;
  mediaMap: Map<string, number>;
}

async function getMediaManagerData(type: MediaType): Promise<MediaManagerData> {
  if (type == MediaType.MOVIE) {
    const mediaManager = new MovieManager();
    const mediaMap = await mediaManager.getMediaNameToIdMap();
    return {
      mediaManager,
      mediaMap,
    };
  }

  if (type == MediaType.TV) {
    const mediaManager = new ShowManager();
    const mediaMap = await mediaManager.getMediaNameToIdMap();
    return {
      mediaManager,
      mediaMap,
    };
  }

  throw Error(`Invalid media type ${type}`);
}
