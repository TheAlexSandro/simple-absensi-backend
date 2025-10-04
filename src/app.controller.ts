import { Body, Controller, Post, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import type { Request, Response } from 'express';
import { Public } from './resources/security/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('ping')
  ping(@Res() res: Response): void {
    return this.appService.ping(res);
  }

  @Public()
  @Post('generateAuthToken')
  generateAuthToken(@Res() res: Response): void {
    return this.appService.generateAuthToken(res);
  }

  @Post('signIn')
  signIn(
    @Res() res: Response,
    @Body('id') id: string | null,
    @Body('password') password: string | null,
  ): void {
    return this.appService.signIn(res, id, password);
  }

  @Post('signOut')
  signOut(@Req() req: Request, @Res() res: Response): void {
    return this.appService.signOut(req, res);
  }

  @Post('register')
  register(
    @Res() res: Response,
    @Body('nama') nama: string | null,
    @Body('jabatan') jabatan: string | null,
    @Body('id') id: string | null
  ): void {
    return this.appService.register(res, nama, jabatan, id);
  }

  @Post('removeUser')
  removeUser(@Res() res: Response, @Body('id') id: string | null): void {
    return this.appService.removeUser(res, id);
  }

  @Post('getAllUser')
  getAllUser(@Res() res: Response): void {
    return this.appService.getAllUser(res);
  }

  @Post('verify')
  verify(@Req() req: Request, @Res() res: Response): void {
    return this.appService.verify(req, res);
  }

  @Post('absen')
  absen(@Res() res: Response, @Body('id') id: string | null): void {
    return this.appService.absen(res, id);
  }
}
