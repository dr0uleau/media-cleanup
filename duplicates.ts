import { Media, MediaType } from "./media.ts";
import { deleteMedia } from "./delete.ts";
import { parseCsvFile } from "./csv.ts";

const filename = Deno.args[0];
const { mediaMap, type } = await parseCsvFile(filename);
const indeterminates = new Set<string>();
const deletes: Media[] = [];

for (const [title, dups] of mediaMap) {
  if (dups.length < 2) continue;

  let maxSize = -1;
  let maxSizeIndex = 0;
  let maxAudio = -1;
  let maxAudioIndex = 0;
  let maxWidth = -1;
  let maxWidthIndex = 0;

  dups.forEach((media, index) => {
    if (maxSize < media.size_in_GB) (maxSize = media.size_in_GB), (maxSizeIndex = index);
    if (maxAudio < media.audio_channels) (maxAudio = media.audio_channels), (maxAudioIndex = index);
    if (maxWidth < media.width) (maxWidth = media.width), (maxWidthIndex = index);
  });

  const bestMediaIndex = determineBestMediaIndex({
    dups,
    maxSizeIndex,
    maxAudioIndex,
    maxWidthIndex,
    title,
    type,
  });

  if (bestMediaIndex == -1) {
    indeterminates.add(title);
  } else {
    let count = 0;
    dups.forEach((media, index) => {
      if (index == bestMediaIndex) return;

      count++;
      deletes.push(media);
    });

    if (count + 1 !== dups.length) throw Error("Error!");
  }
}

indeterminates.forEach((title: string) => {
  console.log(
    "Non-trivial duplicate decision " +
      title +
      ": " +
      mediaMap.get(title)!.map((media: Media) =>
        JSON.stringify({
          size: media.size_in_GB,
          audio: media.audio_channels,
          width: media.width,
          bitrate: media.bitrate_mbps,
        })
      )
  );
});

if (indeterminates.size === 0) {
  deleteMedia(deletes);
}

const enum Dimension {
  SIZE = 1,
  WIDTH = 2,
  AUDIO = 3,
}

export interface Comparison {
  media: Media;
  otherMedia: Media;
  dimension: Dimension;
}

function isSimilar(comparison: Comparison): boolean {
  const { media, otherMedia, dimension } = comparison;

  if (media == otherMedia) return true;

  if (dimension == Dimension.SIZE) {
    return (
      Math.max(media.size_in_GB, otherMedia.size_in_GB) /
        Math.min(media.size_in_GB, otherMedia.size_in_GB) <
        1.3 || Math.abs(media.size_in_GB - otherMedia.size_in_GB) < 1.5
    );
  }

  if (dimension == Dimension.AUDIO) {
    return (
      media.audio_channels == otherMedia.audio_channels ||
      (media.audio_channels < 6 &&
        otherMedia.audio_channels < 6 &&
        Math.abs(media.audio_channels - otherMedia.audio_channels) < 2)
    );
  }

  if (dimension == Dimension.WIDTH) {
    return Math.abs(media.width - otherMedia.width) < 500;
  }

  throw Error("Unsupported dimension");
}

function isBetterOrSame(comparison: Comparison): boolean {
  const { media, otherMedia, dimension } = comparison;

  if (media == otherMedia) return true;

  // Size is 50% or more larger
  if (dimension == Dimension.SIZE) {
    return media.size_in_GB / otherMedia.size_in_GB >= 1.5;
  }

  if (dimension == Dimension.AUDIO) {
    return media.audio_channels > otherMedia.audio_channels;
  }

  // 4k > 1080p > 720p
  if (dimension == Dimension.WIDTH) {
    return media.width - otherMedia.width > 500;
  }

  throw Error("Unsupported dimension");
}

function determineBestMediaIndex(props: {
  dups: Media[];
  maxSizeIndex: number;
  maxAudioIndex: number;
  maxWidthIndex: number;
  title: string;
  type: MediaType;
}): number {
  const { dups, maxSizeIndex, maxAudioIndex, maxWidthIndex } = props;
  const maxSize = dups[maxSizeIndex];
  const maxAudio = dups[maxAudioIndex];
  const maxWidth = dups[maxWidthIndex];

  // If maxes all agree, decision is easy
  if (maxSizeIndex == maxAudioIndex && maxSizeIndex == maxWidthIndex) return maxSizeIndex;

  // If the largest media has same audio channels and width as the max, choose max size
  if (
    maxSize.audio_channels == maxAudio.audio_channels &&
    isSimilar({ media: maxSize, otherMedia: maxWidth, dimension: Dimension.WIDTH })
  )
    return maxSizeIndex;

  // If media with most audio channels has same size/width, choose one with most audio channels
  if (
    maxAudio.size_in_GB == maxSize.size_in_GB &&
    isSimilar({ media: maxAudio, otherMedia: maxWidth, dimension: Dimension.WIDTH })
  )
    return maxAudioIndex;

  // Higher resolution trumps other dimensions
  if (
    isBetterOrSame({ media: maxWidth, otherMedia: maxSize, dimension: Dimension.WIDTH }) &&
    isBetterOrSame({ media: maxWidth, otherMedia: maxAudio, dimension: Dimension.WIDTH })
  ) {
    return maxWidthIndex;
  }

  // If size is better and audio is similar, take larger size
  if (
    isBetterOrSame({ media: maxSize, otherMedia: maxAudio, dimension: Dimension.SIZE }) &&
    isSimilar({ media: maxSize, otherMedia: maxAudio, dimension: Dimension.AUDIO })
  ) {
    return maxSizeIndex;
  }

  // If audio is better and size is similar or at least 15GB (Movies) or 1GB (TV),
  // then take the better audio
  if (
    maxAudio.audio_channels > maxSize.audio_channels &&
    (isSimilar({ media: maxAudio, otherMedia: maxSize, dimension: Dimension.SIZE }) ||
      maxSize.audio_channels == 0 ||
      (type == MediaType.MOVIE && maxAudio.size_in_GB > 10) ||
      (type == MediaType.TV && maxAudio.size_in_GB > 0.8))
  ) {
    return maxAudioIndex;
  }

  return -1;
}
