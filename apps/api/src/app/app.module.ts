import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { AuditModule } from '../audit/audit.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Task } from '../entities/task.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL', 'sqlite:./data/tasks.db');
        const isSqlite = databaseUrl.startsWith('sqlite:');
        
        if (isSqlite) {
          return {
            type: 'better-sqlite3',
            database: databaseUrl.replace('sqlite:', ''),
            entities: [User, Organization, Task, AuditLog],
            synchronize: configService.get('NODE_ENV') !== 'production',
          };
        } else {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [User, Organization, Task, AuditLog],
            synchronize: configService.get('NODE_ENV') !== 'production',
            retryAttempts: 3,
            retryDelay: 3000,
          };
        }
      },
    }),
    AuthModule,
    TasksModule,
    AuditModule,
    OrganizationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
