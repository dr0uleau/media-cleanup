import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
import { MediaManager, buildMediaName } from "./MediaManager.ts";

export interface Movie {
  title: string;
  year: number;
  id: number;
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
      const movieName = this.getMovieName(movie);
      const id = movie.id;
      if (movieNameToIdMap.get(movieName)) throw Error(`Duplicate movie name: ${movieName}`);
      if (!movieName || !id) throw Error(`Invalid movie: ${movieName} ${id}`);
      movieNameToIdMap.set(movieName, id);
    });

    return movieNameToIdMap;
  }

  private getMovieName(movie: Movie): string {
    return buildMediaName(movie.title, movie.year.toString());
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
