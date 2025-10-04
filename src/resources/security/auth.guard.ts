import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { Helper } from '../helper/Helper';
import errors from '../errors/errors';
import { Tokenify } from '../helper/Tokenify';
import { Request, Response } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private tokenify: Tokenify,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;
    try {
      const auth_token = request.body['auth_token'] as string;
      const isApproved = await this.tokenify.verifyAuthToken(
        auth_token,
      );
      if (!isApproved) {
        Helper.response(
          res,
          HttpStatus.UNAUTHORIZED,
          false,
          'auth_token kadaluarsa.',
          errors['401']['ACCESS_DENIED'].code,
        );
        return false;
      }

      return true;
    } catch {
      Helper.response(
        res,
        HttpStatus.UNAUTHORIZED,
        false,
        errors['401']['ACCESS_DENIED'].message,
        errors['401']['ACCESS_DENIED'].code,
      );
      return false;
    }
  }
}
