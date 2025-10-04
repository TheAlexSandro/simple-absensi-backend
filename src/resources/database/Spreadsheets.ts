import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { Helper } from '../helper/Helper';

export class Spreadsheet {
  private static doc: GoogleSpreadsheet;
  private split_tgl: any[];
  private tanggal: string;

  constructor() {
    const auth = new JWT({
      key: String(process.env['G_PRIVATE_KEY']).replace(/\\n/g, '\n'),
      email: String(process.env['G_CLIENT_EMAIL']),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    Spreadsheet.doc = new GoogleSpreadsheet(
      String(process.env['G_SHEET']),
      auth,
    );
    this.split_tgl = Helper.getTanggal().split('-');
    this.tanggal = `${this.split_tgl[0]}-${this.split_tgl[1]}`;
  }

  private loadSheet(sheetName: string) {
    return Spreadsheet.doc.loadInfo().then(() => {
      const sheet = Spreadsheet.doc.sheetsByTitle[sheetName];
      if (!sheet) throw new Error('Sheet not found: ' + sheetName);
      return sheet;
    });
  }

  public setRekapHarian(
    sheetName: string,
    data: any,
    callback?: (err: any, ok?: boolean) => void,
  ) {
    this.loadSheet(sheetName)
      .then((sheet) => {
        return sheet.addRow([
          data.id || '',
          data.nama || '',
          data.jabatan || '',
          data.waktu || '',
          data.status || '',
        ]);
      })
      .then(() => callback?.(null, true))
      .catch((err) => {
        console.error('Error setRekapHarian:', err);
        callback?.(err, false);
      });
  }

  public setRekapMingguan(
    sheetHarian: string,
    sheetMingguan: string,
    totalHariKerja: number,
    callback?: (err: any, ok?: boolean) => void,
  ) {
    this.loadSheet(sheetHarian)
      .then((harianSheet) => harianSheet.getRows())
      .then((rows) => {
        const summary: Record<string, any> = {};
        const counter: Record<string, number> = {};

        rows.forEach((row: any) => {
          const id = row._rawData[0];
          const nama = row._rawData[1];
          const jabatan = row._rawData[2];
          const waktu = row._rawData[3];
          const status = (row._rawData[4] || '').toLowerCase();
          const tgl = waktu.split(' ')[0];

          if (!summary[id]) {
            summary[id] = {
              id,
              nama,
              jabatan,
              masuk: 0,
              terlambat: 0,
              lembur: 0,
              hadirTanggal: new Set<string>(),
            };
            counter[id] = 0;
          }

          counter[id]++;

          if (status === 'masuk') summary[id].masuk++;
          if (status === 'terlambat') summary[id].terlambat++;
          if (status === 'lembur') summary[id].lembur++;
          if (status === 'masuk' || status === 'terlambat')
            summary[id].hadirTanggal.add(tgl);
        });

        Object.keys(summary).forEach((id) => {
          if (counter[id] < 5) delete summary[id];
        });

        Object.values(summary).forEach((s: any) => {
          const totalHadirHari = s.hadirTanggal.size;
          s.tidakMasuk = totalHariKerja - totalHadirHari;
          s.persentase =
            ((totalHadirHari / totalHariKerja) * 100).toFixed(2) + '%';
        });

        return Object.values(summary);
      })
      .then((data: any[]) =>
        this.loadSheet(sheetMingguan).then((mingguanSheet) =>
          mingguanSheet
            .getRows()
            .then((rows) => ({ mingguanSheet, rows, data })),
        ),
      )
      .then(({ mingguanSheet, rows, data }) => {
        const updates: Promise<any>[] = [];

        data.forEach((s: any) => {
          //@ts-ignore
          const existing = rows.find((r) => r._rawData[0] === s.id);
          if (existing) {
            //@ts-ignore
            existing._rawData[1] = s.nama;
            //@ts-ignore
            existing._rawData[2] = s.jabatan;
            //@ts-ignore
            existing._rawData[3] = this.tanggal;
            //@ts-ignore
            existing._rawData[4] = String(s.masuk);
            //@ts-ignore
            existing._rawData[5] = String(s.terlambat);
            //@ts-ignore
            existing._rawData[6] = String(s.lembur);
            //@ts-ignore
            existing._rawData[7] = String(s.tidakMasuk);
            //@ts-ignore
            existing._rawData[8] = s.persentase;
            updates.push(existing.save());
          } else {
            updates.push(
              mingguanSheet.addRow([
                s.id,
                s.nama,
                s.jabatan,
                this.tanggal,
                String(s.masuk),
                String(s.terlambat),
                String(s.lembur),
                String(s.tidakMasuk),
                s.persentase,
              ]),
            );
          }
        });

        return Promise.all(updates);
      })
      .then(() => callback?.(null, true))
      .catch((err) => callback?.(err, false));
  }

  public setRekapBulanan(
    sheetMingguan: string,
    sheetBulanan: string,
    bulan: string,
    totalHariKerja: number,
    callback?: (err: any, ok?: boolean) => void,
  ) {
    this.loadSheet(sheetMingguan)
      .then((mingguanSheet) => mingguanSheet.getRows())
      .then((rows) => {
        const summary: Record<string, any> = {};
        const counter: Record<string, number> = {};

        rows.forEach((row: any) => {
          const id = row._rawData[0];
          const nama = row._rawData[1];
          const jabatan = row._rawData[2];
          const mingguTanggal = row._rawData[3] || '';

          if (!mingguTanggal.startsWith(bulan)) return;

          if (!summary[id]) {
            summary[id] = {
              id,
              nama,
              jabatan,
              masuk: 0,
              terlambat: 0,
              lembur: 0,
              tidakMasuk: 0,
            };
            counter[id] = 0;
          }

          counter[id]++; // hitung jumlah minggu user ini

          summary[id].masuk += Number(row._rawData[4] || 0);
          summary[id].terlambat += Number(row._rawData[5] || 0);
          summary[id].lembur += Number(row._rawData[6] || 0);
          summary[id].tidakMasuk += Number(row._rawData[7] || 0);
        });

        // filter user yang punya < 22 data mingguan
        Object.keys(summary).forEach((id) => {
          if (counter[id] < 22) delete summary[id];
        });

        Object.values(summary).forEach((s: any) => {
          const totalHadirHari = s.masuk + s.terlambat;
          s.persentase =
            ((totalHadirHari / totalHariKerja) * 100).toFixed(2) + '%';
        });

        return Object.values(summary);
      })
      .then((data: any[]) =>
        this.loadSheet(sheetBulanan).then((bulanSheet) =>
          bulanSheet.getRows().then((rows) => ({ bulanSheet, rows, data })),
        ),
      )
      .then(({ bulanSheet, rows, data }) => {
        const updates: Promise<any>[] = [];

        data.forEach((s: any) => {
          //@ts-ignore
          const existing = rows.find((r) => r._rawData[0] === s.id);
          if (existing) {
            //@ts-ignore
            existing._rawData[1] = s.nama;
            //@ts-ignore
            existing._rawData[2] = s.jabatan;
            //@ts-ignore
            existing._rawData[3] = this.tanggal;
            //@ts-ignore
            existing._rawData[4] = String(s.masuk);
            //@ts-ignore
            existing._rawData[5] = String(s.terlambat);
            //@ts-ignore
            existing._rawData[6] = String(s.lembur);
            //@ts-ignore
            existing._rawData[7] = String(s.tidakMasuk);
            //@ts-ignore
            existing._rawData[8] = s.persentase;
            updates.push(existing.save());
          } else {
            updates.push(
              bulanSheet.addRow([
                s.id,
                s.nama,
                s.jabatan,
                this.tanggal,
                String(s.masuk),
                String(s.terlambat),
                String(s.lembur),
                String(s.tidakMasuk),
                s.persentase,
              ]),
            );
          }
        });

        return Promise.all(updates);
      })
      .then(() => callback?.(null, true))
      .catch((err) => callback?.(err, false));
  }
}
