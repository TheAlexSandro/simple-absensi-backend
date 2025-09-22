import * as crypto from 'crypto';

export class Password {
  static generateSalt = (length: number = 16): string => {
    return crypto.randomBytes(length).toString('hex');
  };

  static hashPassword = (password: string, salt: string): string => {
    const hash = crypto
      .createHmac('sha256', salt)
      .update(password)
      .digest('hex');
    return hash;
  };

  static encryptPassword = (password: string): object => {
    const salt = this.generateSalt();
    const hash = this.hashPassword(password, salt);
    return { salt, hash };
  };

  static verifyPassword = (
    inputPassword: string,
    salt: string,
    hash: string,
  ): boolean => {
    const inputHash = this.hashPassword(String(inputPassword), salt);
    return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(hash));
  };
}
