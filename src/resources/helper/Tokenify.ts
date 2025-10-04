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

  generateAuthToken(@Res() res: Response): object {
    const duration = Number(process.env['EX_TOKEN']);
    const ress = Hash.generateToken() as HashToken;
    RedisCache.main().set(
      `auth_token-${ress['auth_token']}`,
      JSON.stringify({ salt: ress['salt'], hash: ress['hashed'] }),
      'EX',
      duration,
    );
    return { auth_token: ress['auth_token'] };
  }
}
