import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Tokenify } from './resources/helper/Tokenify';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './resources/security/auth.guard';
import { Spreadsheet } from './resources/database/Spreadsheets';

@Module({
  controllers: [AppController],
  providers: [
    AppService,
    Tokenify,
    Spreadsheet,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [Tokenify, Spreadsheet],
})
export class AppModule {}
