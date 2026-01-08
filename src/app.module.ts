import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoffeesModule } from './coffees/coffees.module';
import { configs } from './config';
import { DatabaseConfig } from './config/database.config';
import { validationSchema } from './config/validation.schema';
import { UsersModule } from './users/users.module';
import { IamModule } from './iam/iam.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
      validationSchema,
      load: configs,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const db = configService.get<DatabaseConfig>('database');

        return {
          type: 'postgres',
          host: db.host,
          port: db.port,
          username: db.user,
          password: db.password,
          database: db.name,
          synchronize: db.synchronize,
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),
    CoffeesModule,
    UsersModule,
    IamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
