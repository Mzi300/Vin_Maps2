import { AppDataSource } from '../data-source';
import { POI } from '../entities/POI';

/**
 * Simple seed script that populates the database with a handful of example POIs.
 * Run with: `npx ts-node src/seed/seedPois.ts`
 */
async function seed() {
  await AppDataSource.initialize();

  const pois: Partial<POI>[] = [
    {
      name: 'Endaweni BnB',
      lat: -26.12345,
      lon: 27.98765,
      category: 'lodging',
      aliases: ['bnb', 'guesthouse', 'endaweni'],
      rating: 4.5,
      reviewCount: 12,
      popularityScore: 0.8,
      isVerified: true,
      source: 'manual',
    },
    {
      name: 'Orange Farm Taxi Rank',
      lat: -26.54321,
      lon: 27.12345,
      category: 'taxi_rank',
      aliases: ['taxi', 'rank', 'orange farm'],
      rating: 4.2,
      reviewCount: 8,
      popularityScore: 0.7,
      isVerified: true,
      source: 'manual',
    },
    {
      name: 'Stretford Clinic',
      lat: -26.6789,
      lon: 27.45678,
      category: 'clinic',
      aliases: ['clinic', 'health', 'stretford'],
      rating: 4.7,
      reviewCount: 20,
      popularityScore: 0.9,
      isVerified: true,
      source: 'manual',
    },
    // Add more landmarks here as needed
  ];

  // Save each POI – TypeORM will generate the UUID primary key.
  await AppDataSource.manager.save(POI, pois as POI[]);
  console.log('✅ POI seed completed');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed', err);
  process.exit(1);
});
