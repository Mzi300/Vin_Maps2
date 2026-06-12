import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { POI } from './entities/POI';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'vinmaps',
  synchronize: true, // set to false in production and use migrations
  logging: false,
  entities: [POI],
});

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Data source has been initialized!');
  })
  .catch((err) => {
    console.error('❌ Error during Data Source initialization', err);
  });
