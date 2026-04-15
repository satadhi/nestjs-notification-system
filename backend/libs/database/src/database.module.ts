import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './database.config';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { ConfigService } from '@nestjs/config';

@Module({})
export class DatabaseModule {
  static forRoot(entities: EntityClassOrSchema[]) {
    return {
      module: DatabaseModule,
       imports: [
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) =>
            getDatabaseConfig(entities, configService),
        }),
      ],
    };
  }
}