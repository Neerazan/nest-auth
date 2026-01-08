import { ConfigType, registerAs } from '@nestjs/config';

const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  name: process.env.DB_NAME,
  synchronize: process.env.NODE_ENV !== 'production',
}));

export default databaseConfig;
export type DatabaseConfig = ConfigType<typeof databaseConfig>;
