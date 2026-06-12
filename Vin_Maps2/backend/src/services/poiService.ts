import { AppDataSource } from '../data-source';
import { POI } from '../entities/POI';
import { ILike } from 'typeorm';

/**
 * Service layer for POI operations. All API routes delegate to these methods.
 * Implements simple fuzzy search (case‑insensitive LIKE) and a PostGIS nearby query.
 */
export class POIService {
  private static repo = AppDataSource.getRepository(POI);

  /** Retrieve every POI (used by the "list all" endpoint). */
  static async findAll(): Promise<POI[]> {
    return this.repo.find();
  }

  /** Retrieve a single POI by its UUID. */
  static async findById(id: string): Promise<POI | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** Simple fuzzy search across name and aliases. */
  static async search(query: string): Promise<POI[]> {
    if (!query) return [];
    // Using ILIKE for case‑insensitive pattern matching.
    return this.repo.find({
      where: [{ name: ILike(`%${query}%`) }, { aliases: ILike(`%${query}%`) }],
    });
  }

  /** Find POIs within a radius (meters) around a coordinate using PostGIS. */
  static async nearby(lat: number, lon: number, radius: number): Promise<POI[]> {
    // Raw SQL because TypeORM spatial helpers are limited.
    const sql = `
      SELECT * FROM pois
      WHERE ST_DWithin(
        geom,
        ST_SetSRID(ST_MakePoint($1, $2), 4326),
        $3
      );
    `;
    return this.repo.query(sql, [lon, lat, radius]);
  }
}
