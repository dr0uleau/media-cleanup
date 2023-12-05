import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
import { MediaManager, getMediaFolderFromPath } from "./MediaManager.ts";
import { MediaType } from "./utils/media.ts";

export interface Movie {
  title: string;
  year: number;
  id: number;
  path: string;
}

await load({ export: true });

export class MovieManager implements MediaManager {
  user: string;
  password: string;
  apiKey: string;

  constructor() {
    this.user = Deno.env.get("RADARR_USER") ?? "";
    this.password = Deno.env.get("RADARR_PASSWORD") ?? "";
    this.apiKey = Deno.env.get("RADARR_API_KEY") ?? "";

    if (!this.user || !this.password || !this.apiKey) {
      throw Error("User, password, or apiKey not set");
    }
  }

  async deleteMedia(id: number, name: string): Promise<void> {
    try {
      const response = await fetch(`${this.buildBaseUrl()}/movie/${id}`, {
        method: "DELETE",
        headers: {
          "X-Api-Key": this.apiKey,
          "Content-Type": "application/json",
        },
      });
      if (response.status !== 200) {
        console.error(`Error deleting movie from Radarr: '${name}'`, response.statusText);
      } else {
        console.log(`Deleted movie from Radarr: '${name}'`);
      }
    } catch (e: unknown) {
      console.error(`Error deleting movie from Radarr: '${name}'`, e);
    }
  }

  async getMediaNameToIdMap(): Promise<Map<string, number>> {
    const movieNameToIdMap = new Map<string, number>();

    const movies = await this.getMovies();
    movies.forEach((movie) => {
      const id = movie.id;
      const movieFolder = getMediaFolderFromPath(movie.path, MediaType.MOVIE);
      if (!movieFolder || !id) throw Error(`Invalid movie: ${movieFolder} ${id}`);

      if (movieNameToIdMap.get(movieFolder)) throw Error(`Duplicate movie name: ${movieFolder}`);
      movieNameToIdMap.set(movieFolder, id);
    });

    return movieNameToIdMap;
  }

  private buildBaseUrl(): string {
    return `http://${this.user}:${this.password}@192.168.1.66:7878/api/v3`;
  }

  private async getMovies(): Promise<Movie[]> {
    const response = await fetch(`${this.buildBaseUrl()}/movie`, {
      method: "GET",
      headers: {
        "X-Api-Key": this.apiKey,
        "Content-Type": "application/json",
      },
    });
    return (await response.json()) as Movie[];
  }
}

console.log(await new MovieManager().getMediaNameToIdMap());
