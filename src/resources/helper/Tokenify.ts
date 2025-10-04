import { Hash } from './Hash';
import { Injectable, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RedisCache } from '../database/Redis';
import { Helper } from './Helper';

type HashToken = { token: string; salt: string; hash: string };
type Callback<T> = (error: string | null, result: T) => void;

@Injectable()
export class Tokenify {
  verifyAuthToken(auth_token: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!auth_token) return resolve(false);
      RedisCache.main()
        .get(`auth_token-${auth_token}`)
        .then((result) => {
          if (!result) return resolve(false);
          const tokens: HashToken = JSON.parse(result);
          const verify = Hash.verifyToken(
            auth_token,
            tokens['salt'],
            tokens['hash'],
          );
          if (!verify) return resolve(false);
          return resolve(true);
        });
    });
  }

  verifyAccessToken(
    @Req() req: Request,
    callback: Callback<null | boolean | string>,
  ): void {
    const getToken = req.cookies['access_token'];
    if (!getToken) return callback(null, false);
    RedisCache.main()
      .get(`access_token-${getToken}`)
      .then((r) => {
        if (!r) return callback(null, false);
        const parser = JSON.parse(r);
        RedisCache.getUser(parser['user_id'], (err, result) => {
          return callback(null, result);
        });
      });
  }

  generateAuthToken(@Res() res: Response): object {
    const duration = Number(process.env['REDIS_EX']);
    const ress = Hash.generateToken() as HashToken;
    RedisCache.main().set(
      `auth_token-${ress['auth_token']}`,
      JSON.stringify({ salt: ress['salt'], hash: ress['hashed'] }),
      'EX',
      duration,
    );
    return { auth_token: ress['auth_token'] };
  }

  generateAccessToken(@Res() res: Response, id: string): void {
    const token = Helper.generateID(50, 'alphanumeric');
    RedisCache.main().set(
      `access_token-${token}`,
      JSON.stringify({ token, user_id: id }),
      'EX',
      Number(process.env['REDIS_EX']),
    );
    res.cookie(`access_token`, token, {
      httpOnly: true,
      secure: true,
      path: '/',
      domain: String(process.env['COOKIE_DOMAIN']),
      sameSite: String(process.env['COOKIE_SAME_SITE']) as
        | 'lax'
        | 'none'
        | 'strict',
    });
  }

  removeAccessToken(@Req() req: Request): void {
    const getToken = req.cookies['access_token'];
    if (!getToken) return;
    RedisCache.main().del(`access_token-${getToken}`);
  }
}
