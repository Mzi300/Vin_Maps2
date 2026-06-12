import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),

  // Authentication
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().required(),

  // API Secrets
  MAPBOX_TOKEN: Joi.string().required(),
  TRAFFIC_API_KEY: Joi.string().required(),
  // TomTom Quota
  TOMTOM_QUOTA_DAILY: Joi.number().default(10000),
  // API Usage
  API_USAGE_RETENTION_DAYS: Joi.number().default(90),
  // Analytics
  ANALYTICS_RETENTION_DAYS: Joi.number().default(30),
  // Promotions
  PROMOTION_RETENTION_DAYS: Joi.number().default(90),
  // Business limits
  MAX_FREE_PLACES: Joi.number().default(10),
});
