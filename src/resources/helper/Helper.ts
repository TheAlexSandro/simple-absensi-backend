import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';

type IDType = 'alphanumeric' | 'numeric';
interface Absensi {
  masuk?: string;
  status_masuk?: string;
  keluar?: string;
  status_keluar?: string;
}
type Ident = 'id' | 'nama';
type UserData = {
  user_id: string;
  data: {
    user_id: string;
    nama: string;
    jabatan: string;
    absent: any[];
  };
};

export class Helper {
  static response(
    res: Response,
    status_code: HttpStatus,
    ok: boolean,
    message: string | Error | null = null,
    error_code: string | null = null,
    result: any = null,
  ): void {
    const responseData = this.cleanJSON({
      status_code,
      ok,
      error_code,
      message: message instanceof Error ? message.message : message,

      result,
    });

    res.status(status_code).json(responseData);
  }

  static cleanJSON<T extends Record<string, any>>(data: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(data).filter(
        ([_, value]) => value !== undefined && value !== null,
      ),
    ) as Partial<T>;
  }

  static generateID = (length: number, type?: IDType): string => {
    const characters =
      type == 'alphanumeric'
        ? 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        : '0123456789';
    const panjangKarakter = characters.length;
    let result = '';

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * panjangKarakter));
    }

    return result;
  };

  static toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  static getStatus(time: string, jamMasuk: string, jamKeluar: string): string {
    const menit = this.toMinutes(time);

    const masuk = this.toMinutes(jamMasuk);
    const terlambat = masuk + 60;
    const izinMulai = masuk + 120;
    const izinAkhir = this.toMinutes(jamKeluar) - 60;
    const keluar = this.toMinutes(jamKeluar);
    const lemburAkhir = keluar + 9 * 60;

    if (menit < masuk) return 'masuk';
    if (menit >= masuk && menit <= terlambat) return 'terlambat';
    if (menit >= keluar && menit <= lemburAkhir) return 'lembur';
    return 'di luar jam kerja';
  }

  static getCurrentTime(): string {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(now).replace('.', ':');
  }

  static getTanggal(): string {
    const now = new Date();
    const year = now.getFullYear();
    const mon = String(now.getMonth()).padStart(0, '2');
    const dt = String(now.getDate()).padStart(0, '2');

    return `${year}-${mon}-${dt}`;
  }

  static isDuplicate(
    type: Ident,
    nama: string | null,
    id: string | null,
    jabatan: string,
    data: UserData[] | undefined,
  ) {
    if (!data) return false;
    if (type == 'nama') {
      return data.some(
        (item) =>
          item.data.nama.toLowerCase().trim() ===
            String(nama).toLowerCase().trim() &&
          item.data.jabatan.toLowerCase().trim() === jabatan.toLowerCase().trim(),
      );
    } else {
      return data.some(
        (item) =>
          item.user_id.toLowerCase().trim() ===
            String(id).toLowerCase().trim()
      );
    }
  }
}
