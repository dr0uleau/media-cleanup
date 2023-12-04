export interface MediaManager {
  user: string;
  password: string;
  apiKey: string;

  deleteMedia(id: number, name: string): Promise<void>;
  getMediaNameToIdMap(): Promise<Map<string, number>>;
}

export function buildMediaName(title: string, year: string): string {
  return title + ` (${year})`;
}
