import { HttpStatus, Injectable, Res, Req } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RedisCache } from './resources/database/Redis';
import { Helper } from './resources/helper/Helper';
import errors from './resources/errors/errors';
import { Password } from './resources/helper/Password';
import { Tokenify } from './resources/helper/Tokenify';

@Injectable()
export class AppService {
  constructor(private readonly tokenify: Tokenify) {}

  ping(@Res() res: Response) {
    return Helper.response(res, HttpStatus.OK, true, 'Pong!');
  }

  generateAuthToken(@Res() res: Response) {
    const result = this.tokenify.generateAuthToken(res);
    return Helper.response(res, HttpStatus.OK, true, 'Success!', null, result['auth_token']);
  }

  signIn(@Res() res: Response, id: string | null, password: string | null) {
    if (!id || !password)
      return Helper.response(
        res,
        HttpStatus.OK,
        false,
        errors['404']['EMPTY_PARAMETER'].message.replace(
          '{param}',
          'id, password',
        ),
        errors['404']['EMPTY_PARAMETER'].code,
      );

    RedisCache.getUser(id, (error, result) => {
      if (error)
        return Helper.response(
          res,
          HttpStatus.OK,
          false,
          error,
          errors['400']['BAD_REQUEST'].code,
        );
      if (!result)
        return Helper.response(
          res,
          HttpStatus.OK,
          false,
          errors['404']['USER_NOT_FOUND'].message,
          errors['404']['USER_NOT_FOUND'].code,
        );
      const pwd = result['password'].split('|');

      const verify = Password.verifyPassword(password, pwd[0], pwd[1]);
      if (!verify)
        return Helper.response(
          res,
          HttpStatus.OK,
          false,
          errors['401']['UNAUTHORIZED_ACCESS'].message,
          errors['401']['UNAUTHORIZED_ACCESS'].code,
        );

      //this.tokenify.generateAcessToken(id);
      return Helper.response(
        res,
        HttpStatus.OK,
        true,
        'Success!',
        null,
        result['absent'],
      );
    });
  }

  signOut(@Req() req: Request, @Res() res: Response) {
    //this.tokenify.removeAccessToken(req, res);
    return Helper.response(res, HttpStatus.OK, true, 'Success!');
  }

  register(
    @Res() res: Response,
    nama: string | null,
    jabatan: string | null,
    password: string | null,
  ) {
    if (!nama || !jabatan || !password)
      return Helper.response(
        res,
        HttpStatus.OK,
        false,
        errors['404']['EMPTY_PARAMETER'].message.replace(
          '{param}',
          'nama, jabatan, password',
        ),
        errors['404']['EMPTY_PARAMETER'].code,
      );
    if (!['admin', 'guru', 'siswa', 'staff'].includes(jabatan))
      return Helper.response(
        res,
        HttpStatus.OK,
        false,
        errors['404']['INVALID_VALUE_IN_PARAMETER'].message
          .replace('{param}', 'jabatan')
          .replace('{accept}', 'admin, guru, siswa, staff'),
        errors['404']['INVALID_VALUE_IN_PARAMETER'].code,
      );

    const accID = Helper.generateID(8, 'numeric');
    const enc = Password.encryptPassword(password);
    const data = { password: `${enc['salt']}|${enc['hash']}`, absent: [] };
    RedisCache.main().set(`account-${accID}`, JSON.stringify(data));
    return Helper.response(res, HttpStatus.OK, true, 'Success!');
  }

  // verify(@Req() req: Request, @Res() res: Response) {
  //   this.tokenify.verifyAccessToken(req, (error, result) => {
  //     if (error)
  //       return Helper.response(
  //         res,
  //         HttpStatus.OK,
  //         false,
  //         error,
  //         errors['400']['BAD_REQUEST'].code,
  //       );
  //     if (!result)
  //       return Helper.response(
  //         res,
  //         HttpStatus.OK,
  //         false,
  //         errors['401']['ACCESS_DENIED'].message,
  //         errors['401']['ACCESS_DENIED'].code,
  //       );

  //     return Helper.response(
  //       res,
  //       HttpStatus.OK,
  //       true,
  //       'Success!',
  //       null,
  //       result['absent'],
  //     );
  //   });
  // }

  absen(@Res() res: Response, id: string | null) {
    if (!id)
      return Helper.response(
        res,
        HttpStatus.OK,
        false,
        errors['404']['EMPTY_PARAMETER'].message.replace('{param}', 'id'),
        errors['404']['EMPTY_PARAMETER'].code,
      );

    RedisCache.getUser(id, (error, result) => {
      if (error)
        return Helper.response(
          res,
          HttpStatus.OK,
          false,
          error,
          errors['400']['BAD_REQUEST'].code,
        );
      if (!result)
        return Helper.response(
          res,
          HttpStatus.OK,
          false,
          errors['404']['USER_NOT_FOUND'].message,
          errors['404']['USER_NOT_FOUND'].code,
        );

      RedisCache.main()
        .get(`times`)
        .then((time) => {
          if (!time)
            return Helper.response(
              res,
              HttpStatus.OK,
              false,
              'Invalid time.',
              errors['400']['BAD_REQUEST'].code,
            );
          const absen = result['absen'];
          const cTime = time.split('|');
          const waktu = Helper.getCurrentTime();
          const absensi = Helper.getStatus(waktu, cTime[0], cTime[1]);
          absen.push({
            id: absen.length + 1,
            waktu: `${waktu} UTC`,
            status: absensi,
          });
          result['absen'] = absen;

          RedisCache.main().set(`account-${id}`, JSON.stringify(result));
          return Helper.response(res, HttpStatus.OK, true, 'Success!', null, result);
        });
    });
  }
}
