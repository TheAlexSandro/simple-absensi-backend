import { HttpStatus, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RedisCache } from './resources/database/Redis';
import { Helper } from './resources/helper/Helper';
import errors from './resources/errors/errors';
import { Password } from './resources/helper/Password';
import { Tokenify } from './resources/helper/Tokenify';
import { Spreadsheet } from './resources/database/Spreadsheets';

@Injectable()
export class AppService {
  constructor(
    private readonly tokenify: Tokenify,
    private readonly sheets: Spreadsheet,
  ) {}

  ping(res: Response) {
    return Helper.response(res, HttpStatus.OK, true, 'Pong!');
  }

  generateAuthToken(res: Response) {
    const result = this.tokenify.generateAuthToken(res);
    return Helper.response(
      res,
      HttpStatus.OK,
      true,
      'Success!',
      null,
      result['auth_token'],
    );
  }

  signIn(res: Response, id: string | null, password: string | null) {
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
      if (!result || !result['password'])
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

      this.tokenify.generateAccessToken(res, id);
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

  signOut(req: Request, res: Response) {
    this.tokenify.removeAccessToken(req);
    return Helper.response(res, HttpStatus.OK, true, 'Success!');
  }

  register(
    res: Response,
    nama: string | null,
    jabatan: string | null,
    id: string | null,
  ) {
    if (!nama || !jabatan)
      return Helper.response(
        res,
        HttpStatus.OK,
        false,
        errors['404']['EMPTY_PARAMETER'].message.replace(
          '{param}',
          'nama, jabatan',
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
    RedisCache.getAllAccount(`account-`, (e, r) => {
      if (r?.length == 0)
        return Helper.response(
          res,
          HttpStatus.OK,
          false,
          'Tidak pernah ada pengguna yang terdaftar.',
          errors['404']['USER_NOT_FOUND'].code,
        );

      const userList = r?.filter((item) => item.user_id != 'admin');
      const finds = id
        ? Helper.isDuplicate('id', null, id, jabatan, userList)
        : Helper.isDuplicate('nama', nama, null, jabatan, userList);
      if (finds)
        return Helper.response(
          res,
          HttpStatus.OK,
          false,
          errors['400']['USER_FOUND'].message,
          errors['400']['USER_FOUND'].code,
        );

      const accID = id ? id : Helper.generateID(9, 'numeric');
      const data = {
        user_id: accID,
        nama,
        jabatan,
        absent: [],
      };
      RedisCache.main().set(`account-${accID}`, JSON.stringify(data));
      return Helper.response(res, HttpStatus.OK, true, 'Success!', null, {
        user_id: accID,
      });
    });
  }

  removeUser(res: Response, id: string | null) {
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
          'Pengguna tidak ditemukan.',
          errors['404']['USER_NOT_FOUND'].code,
        );

      RedisCache.main().del(`account-${id}`);
      return Helper.response(res, HttpStatus.OK, true, 'Pengguna dihapus!');
    });
  }

  getAllUser(res: Response) {
    RedisCache.getAllAccount('account-', (error, data) => {
      if (data?.length == 0)
        return Helper.response(
          res,
          HttpStatus.OK,
          false,
          'Tidak pernah ada pengguna yang terdaftar.',
          errors['404']['USER_NOT_FOUND'].code,
        );
      const userList = data?.filter((item) => item.user_id != 'admin');

      return Helper.response(
        res,
        HttpStatus.OK,
        true,
        'Success!',
        null,
        userList,
      );
    });
  }

  verify(req: Request, res: Response) {
    this.tokenify.verifyAccessToken(req, (error, result) => {
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
          errors['401']['ACCESS_DENIED'].message,
          errors['401']['ACCESS_DENIED'].code,
        );

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

  absen(res: Response, id: string | null) {
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
          const absen = result['absent'];
          const cTime = time.split('|');
          const waktu = Helper.getCurrentTime();
          const absensi = Helper.getStatus(waktu, cTime[0], cTime[1]);
          const tgls = Helper.getTanggal();
          const absenData = {
            id: result['user_id'],
            nama: result['nama'],
            jabatan: result['jabatan'],
            waktu: `${tgls} ${waktu} GMT+7`,
            status: absensi,
          };

          absen.push(absenData);
          result['absent'] = absen;
          this.sheets.setRekapHarian('HARIAN', absenData);
          this.sheets.setRekapMingguan(
            'HARIAN',
            'MINGGUAN',
            Number(process.env['TOTAL_HARI_MINGGUAN']),
          );
          const spl = tgls.split('-');
          this.sheets.setRekapBulanan(
            'MINGGUAN',
            'BULANAN',
            `${spl[0]}-${spl[1]}`,
            Number(process.env['TOTAL_HARI_BULANAN']),
          );

          RedisCache.main().set(`account-${id}`, JSON.stringify(result));
          return Helper.response(
            res,
            HttpStatus.OK,
            true,
            'Success!',
            null,
            absenData,
          );
        });
    });
  }
}
