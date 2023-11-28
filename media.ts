export enum MediaType {
  MOVIE,
  TV,
}

export interface Media {
  title: string;
  file: string;
  imdb_rating: string;
  size_in_GB: number;
  bitrate_mbps: number;
  audio_channels: number;
  width: number;
  height: number;
  type: MediaType;
}

export function rowToMedia(row: any, type: MediaType): Media {
  return {
    title: row.title,
    file: row.file,
    imdb_rating: row.imdb_rating,
    size_in_GB: +row.size_in_GB,
    bitrate_mbps: +row.bitrate_mbps,
    audio_channels: +row.audio_channels,
    width: +row.width,
    height: +row.height,
    type: type,
  };
}
