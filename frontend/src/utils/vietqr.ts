/**
 * VietQR Dynamic Link & Banking Generator conforming to Napas247 standard
 */

export interface IVietQROptions {
  bankId?: string; // MBBank = 'MB', Techcombank = 'TCB', Vietcombank = 'VCB'
  accountNo: string;
  accountName: string;
  amount: number;
  description: string;
  template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}

export const generateVietQRUrl = (options: IVietQROptions): string => {
  const bank = options.bankId || 'MB';
  const account = encodeURIComponent(options.accountNo);
  const template = options.template || 'compact2';
  const amount = Math.round(options.amount);
  const desc = encodeURIComponent(options.description);
  const name = encodeURIComponent(options.accountName);

  return `https://img.vietqr.io/image/${bank}-${account}-${template}.png?amount=${amount}&addInfo=${desc}&accountName=${name}`;
};

export const DEFAULT_BUILDING_BANK_ACCOUNT = {
  bankName: 'MBBank (Ngân hàng Quân Đội)',
  bankCode: 'MB',
  accountNo: '09128889999',
  accountName: 'BQL SUNSHINE HOMES',
  branch: 'Chi nhánh Tràng An - Hà Nội',
};
