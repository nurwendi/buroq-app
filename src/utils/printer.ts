import AsyncStorage from '@react-native-async-storage/async-storage';
import { BLEPrinter } from '@poriyaalar/react-native-thermal-receipt-printer';

export interface ReceiptData {
  invoiceNumber: string;
  customerName: string;
  date: string;
  amount: number;
  paymentMethod: string;
}

const PRINTER_MAC_KEY = '@buroq_printer_mac';

export const savePrinterMac = async (mac: string) => {
  await AsyncStorage.setItem(PRINTER_MAC_KEY, mac);
};

export const getPrinterMac = async () => {
  return await AsyncStorage.getItem(PRINTER_MAC_KEY);
};

export const getAvailablePrinters = async () => {
  try {
    await BLEPrinter.init();
    const devices = await BLEPrinter.getDeviceList();
    return devices;
  } catch (error) {
    console.error('Failed to get devices', error);
    return [];
  }
};

export const printReceipt = async (data: ReceiptData) => {
  const mac = await getPrinterMac();
  if (!mac) {
    throw new Error('Printer belum disetting.');
  }

  const payload = `
[C]<b>BUROQ BILLING</b>
[C]--------------------------------
[C]<b>STRUK PEMBAYARAN</b>
[C]--------------------------------
[L]No. Invoice : ${data.invoiceNumber}
[L]Tanggal     : ${data.date}
[L]Pelanggan   : ${data.customerName}
[C]--------------------------------
[L]Metode      : ${data.paymentMethod}
[L]<b>TOTAL       : Rp ${data.amount.toLocaleString()}</b>
[C]--------------------------------
[C]Terima kasih telah berlangganan
[C]Buroq Manager - Layanan Cepat & Handal
[C]
[C]
`;

  try {
    await BLEPrinter.init();
    await BLEPrinter.connectPrinter(mac);
    
    return new Promise((resolve, reject) => {
      BLEPrinter.printBill(
        payload,
        { beep: true, tailingLine: true },
        () => resolve(true),
        (err: Error) => {
          console.error('PrintBill error', err);
          reject(err);
        }
      );
    });
  } catch (error) {
    console.error('Printing failed', error);
    throw error;
  }
};
export const printReport = async (monthName: string, year: number, data: any) => {
  const mac = await getPrinterMac();
  if (!mac) {
    throw new Error('Printer belum disetting.');
  }

  let payload = `
[C]<b>LAPORAN KEUANGAN</b>
[C]<b>${monthName.toUpperCase()} ${year}</b>
[C]--------------------------------
[L]Revenue     : Rp ${data.summary.totalRevenue.toLocaleString()}
[L]Unpaid      : Rp ${data.summary.totalUnpaid.toLocaleString()}
[L]Expenses    : Rp ${data.summary.totalCommissions.toLocaleString()}
[C]--------------------------------
[L]<b>NET INCOME   : Rp ${data.summary.netIncome.toLocaleString()}</b>
[C]--------------------------------
[C]<b>PERFORMA STAFF</b>
`;

  data.staffBreakdown.forEach((s: any) => {
    payload += `[L]${s.name.padEnd(12)} : ${s.count} trx\n`;
  });

  payload += `
[C]--------------------------------
[C]<i>Buroq Manager Mobile</i>
[C]
[C]
`;

  try {
    await BLEPrinter.init();
    await BLEPrinter.connectPrinter(mac);
    
    return new Promise((resolve, reject) => {
      BLEPrinter.printBill(
        payload,
        { beep: true, tailingLine: true },
        () => resolve(true),
        (err: Error) => {
          console.error('PrintReport error', err);
          reject(err);
        }
      );
    });
  } catch (error) {
    console.error('PrintReport failed', error);
    throw error;
  }
};

