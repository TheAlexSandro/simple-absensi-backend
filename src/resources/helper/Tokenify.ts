import { Hash } from './Hash';
import { Injectable, } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RedisCache } from '../database/Redis';
import { Helper } from './Helper';

type HashToken = { token: string; salt: string; hash: string };
type Callback<T> = (error: string | null, result: T) => void;

@Injectable()
export class Tokenify {
  verifyAuthToken(req: Request, auth_token: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!auth_token) return resolve(false);
      const getCookie = req.cookies['auth_token'];
      if (!getCookie) return resolve(false);
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
    req: Request,
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

  generateAuthToken(res: Response): object {
    const duration = Number(process.env['REDIS_EX']);
    const ress = Hash.generateToken() as HashToken;
    RedisCache.main().set(
      `auth_token-${ress['auth_token']}`,
      JSON.stringify({ salt: ress['salt'], hash: ress['hashed'] }),
      'EX',
      duration,
    );
    res.cookie('auth_token', ress['auth_token'], {
      maxAge: Number(process.env['COOKIE_EX']),
      secure: true,
      httpOnly: true,
      path: '/',
      domain: String(process.env['COOKIE_DOMAIN']),
      sameSite: String(process.env['COOKIE_SAME_SITE']) as
        | 'lax'
        | 'none'
        | 'strict',
    });
    return { auth_token: ress['auth_token'] };
  }

  generateAccessToken(res: Response, id: string): void {
    const token = Helper.generateID(50, 'alphanumeric');
    RedisCache.main().set(
      `access_token-${token}`,
      JSON.stringify({ token, user_id: id }),
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

  removeAccessToken(req: Request): void {
    const getToken = req.cookies['access_token'];
    if (!getToken) return;
    RedisCache.main().del(`access_token-${getToken}`);
  }
}
