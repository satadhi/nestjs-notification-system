import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './database.config';

@Module({})
export class DatabaseModule {
  static forRoot(schema: string) {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: () => getDatabaseConfig(schema),
        }),
      ],
    };
  }
}