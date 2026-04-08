import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (schema: string): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  schema, 
  autoLoadEntities: true,
  synchronize: true,
});