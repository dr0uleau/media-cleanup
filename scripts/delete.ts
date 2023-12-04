import { MediaManager } from "../MediaManager.ts";
import { MovieManager } from "../MovieManager.ts";
import { ShowManager } from "../ShowManager.ts";
import { MediaType } from "../utils/media.ts";
import { parseCsvFile } from "../utils/csv.ts";
import { executeDeleteMediaFolder } from "../utils/filesystem.ts";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
import { dryRunLog } from "../utils/dryrun.ts";

await load({ export: true });
// default to dryrun
const dryrun: boolean = JSON.parse(Deno.env.get("DRYRUN") ?? "true");
console.log(`[DRYRUN] ${dryrun}`);
const filename = Deno.args[0];
const { mediaMap, type } = await parseCsvFile(filename);
const mediaManagerData = await getMediaManagerData(type);

for (const [title, medias] of mediaMap) {
  if (medias.length > 1) throw Error(`Media with duplicates! ${title}`);

  const media = medias[0];
  if (media.skip == null || media.skip == undefined)
    throw Error(`Invalid media ${JSON.stringify(media)}`);
  if (media.skip.length > 0) {
    continue;
  }

  executeDeleteMediaFolder(media, dryrun);

  const mediaId = mediaManagerData.mediaMap.get(media.name);
  if (!mediaId) {
    console.log(`${dryRunLog(dryrun)}[MEDIA MANAGER] NOT FOUND: ${media.name}`);
  } else {
    if (!dryrun) await mediaManagerData.mediaManager.deleteMedia(mediaId, media.name);
    console.log(`${dryRunLog(dryrun)}[MEDIA MANAGER] DELETED: ${media.name}`);
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
