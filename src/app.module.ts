import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Tokenify } from './resources/helper/Tokenify';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './resources/security/auth.guard';

@Module({
  controllers: [AppController],
  providers: [
    AppService,
    Tokenify,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [Tokenify],
})
export class AppModule {}
