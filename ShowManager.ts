import { ISeries, Sonarr } from "npm:@jc21/sonarr-api";
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
import { MediaManager } from "./MediaManager.ts";

await load({ export: true });

export class ShowManager implements MediaManager {
  user: string;
  password: string;
  apiKey: string;
  sonarr: Sonarr;

  constructor() {
    this.user = Deno.env.get("SONARR_USER") ?? "";
    this.password = Deno.env.get("SONARR_PASSWORD") ?? "";
    this.apiKey = Deno.env.get("SONARR_API_KEY") ?? "";

    if (!this.user || !this.password || !this.apiKey) {
      throw Error("User, password, or apiKey not set");
    }

    this.sonarr = new Sonarr(`http://${this.user}:${this.password}@192.168.1.66:8989`, this.apiKey);
  }

  async deleteMedia(id: number, name: string): Promise<void> {
    try {
      await this.sonarr.deleteShow(id);
      console.log(`Deleted show from Sonarr: '${name}'`);
    } catch (e: unknown) {
      console.error(`Error deleting show from Sonarr: '${name}'`, e);
    }
  }

  async getMediaNameToIdMap(): Promise<Map<string, number>> {
    const showNameToIdMap = new Map<string, number>();

    const shows = await this.sonarr.shows();
    shows.forEach((show: ISeries) => {
      const showName = this.getShowName(show);
      const id = show.id;
      if (showNameToIdMap.get(showName)) throw Error(`Duplicate show name: ${showName}`);
      if (!showName || !id) throw Error(`Invalid show: ${showName} ${id}`);
      showNameToIdMap.set(showName, id);
    });

    return showNameToIdMap;
  }

  private getShowName(show: ISeries): string {
    return show.title;
  }
}
