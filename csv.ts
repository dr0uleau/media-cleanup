import { parse } from "https://deno.land/std@0.207.0/csv/mod.ts";
import { Media, MediaType, rowToMedia } from "./media.ts";

export interface CsvRow {
  title: string;
  file: string;
  imdb_rating: string;
  size_in_GB: string;
  bitrate_mbps: string;
  audio_channels: string;
  width: string;
  height: string;
}

export interface Csv {
  mediaMap: Map<string, Media[]>;
  type: MediaType;
}

export async function parseCsvFile(filename: string): Promise<Csv> {
  const type = filename.toString().startsWith("tv") ? MediaType.TV : MediaType.MOVIE;
  const fileContents = await Deno.readTextFile(filename);
  const data = parse(fileContents, {
    skipFirstRow: true,
    strip: true,
  });

  const csvRows: CsvRow[] = [];
  data.forEach((row) => {
    if (!row.title || !row.file || !row.size_in_GB) {
      console.warn(`Invalid row: ${JSON.stringify(row)}`);
    } else {
      csvRows.push(row as unknown as CsvRow);
    }
  });

  const mediaMap = new Map<string, Media[]>();

  csvRows.forEach((row) => {
    const media = rowToMedia(row, type);

    const title = media.title;
    const existing = mediaMap.get(title);
    if (existing != null) {
      mediaMap.set(title, [...existing, media]);
    } else {
      mediaMap.set(title, [media]);
    }
  });

  return {
    mediaMap,
    type,
  };
}
