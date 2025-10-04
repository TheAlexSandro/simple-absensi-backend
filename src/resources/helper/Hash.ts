import crypto from "crypto";
import { Helper } from "./Helper";

export class Hash {
  static hashToken(token: string, salt: string = ""): string {
    return crypto
      .createHash("sha256")
      .update(token + salt)
      .digest("hex");
  }

  static generateToken(customSalt?: string): object {
    const auth_token = Helper.generateID(100, 'alphanumeric');
    const salt = customSalt ?? crypto.randomBytes(16).toString("hex");
    const hashed = this.hashToken(auth_token, salt);

    return { auth_token, salt, hashed };
  }

  static verifyToken(auth_token: string, salt: string, hashed: string): boolean {
    const check = this.hashToken(auth_token, salt);
    return check === hashed;
  }
}