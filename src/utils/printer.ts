import AsyncStorage from '@react-native-async-storage/async-storage';
import { BLEPrinter } from '@poriyaalar/react-native-thermal-receipt-printer';
import { requestBluetoothPermissions } from './permissions';
import { BUROQ_LOGO_BASE64 } from '../constants/logo';
export interface ReceiptData {
  invoiceNumber: string;
  customerName: string;
  username?: string; // Fallback if name is unknown
  customerId?: string;
  date: string;
  amount: number;
  paymentMethod: string;
  agentFullName?: string;
  agentPhone?: string;
  period?: string;
  status?: string;
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
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      console.warn('Bluetooth permission denied');
      // Continue anyway, maybe it's implicitly granted or older Android
    }
    await BLEPrinter.init();
    const devices = await BLEPrinter.getDeviceList();
    return devices;
  } catch (error) {
    console.error('Failed to get devices', error);
    return [];
  }
};

const printLogo = async () => {
  return new Promise((resolve) => {
    BLEPrinter.printImageBase64(
      BUROQ_LOGO_BASE64,
      { imageWidth: 360, imageHeight: 130 },
      () => resolve(true),
      (err: any) => {
        console.warn('Failed to print logo', err);
        resolve(false);
      }
    );
  });
};

export const printReceipt = async (data: ReceiptData) => {
  const mac = await getPrinterMac();
  if (!mac) {
    throw new Error('Printer belum disetting.');
  }

  const displayCustomer = (data.customerName && data.customerName.toLowerCase() !== 'unknown')
    ? data.customerName
    : (data.username || data.customerName || 'Unknown');

  const payload =
    `<C>--------------------------------
<C>STRUK PEMBAYARAN
<C>${data.invoiceNumber}
<C>--------------------------------
<L>Pelanggan : ${displayCustomer}
${data.customerId ? `<L>ID Pel.   : ${data.customerId}\n` : ''}<L>Tanggal   : ${data.date}
<L>Metode    : ${data.paymentMethod}
${data.period ? `<L>Periode   : ${data.period}\n` : ''}${data.status ? `<L>Status    : ${data.status.toUpperCase() === 'PAID' ? 'LUNAS' : 'BELUM LUNAS'}\n` : ''}<C>--------------------------------
<C><B>Rp ${(Number(data.amount) || 0).toLocaleString()}</B>
<C>--------------------------------
${data.agentFullName ? `<L>Agen      : ${data.agentFullName}\n` : ''}${data.agentPhone ? `<L>No HP     : ${data.agentPhone}\n` : ''}<C>--------------------------------
<C>Terima kasih telah berlangganan
<C>Buroq Sarana Informatika
<C>ASN-140390
\n\n\n`;

  try {
    await BLEPrinter.init();
    await BLEPrinter.connectPrinter(mac);

    // Give a tiny delay after connecting for stability
    await new Promise(r => setTimeout(r, 300));

    // Print logo at the top
    await printLogo();

    return new Promise((resolve, reject) => {
      BLEPrinter.printText(
        payload,
        { beep: true, cut: true, tailingLine: false, encoding: 'UTF8', keepConnection: false },
        () => resolve(true),
        (err: any) => {
          console.error('PrintText error', err);
          reject(new Error(err?.message || 'Gagal cetak teks'));
        }
      );
    });
  } catch (error: any) {
    console.error('Printing failed', error);
    throw new Error(error?.message || 'Koneksi ke printer gagal');
  }
};
export const printReport = async (monthName: string, year: number, data: any) => {
  const mac = await getPrinterMac();
  if (!mac) {
    throw new Error('Printer belum disetting.');
  }

  let payload = `
<C>--------------------------------
<C>LAPORAN KEUANGAN
<C>${monthName.toUpperCase()} ${year}
<C>--------------------------------
<L>Billing/Rev : Rp ${data.summary.totalRevenue.toLocaleString()}
<L>Piutang     : Rp ${data.summary.totalUnpaid.toLocaleString()}
${data.isAgentView ? '' : `<L>Komisi Agen : Rp ${data.summary.totalCommissions.toLocaleString()}\n`}<C>--------------------------------
<L>${data.isAgentView ? 'KOMISI SAYA' : 'NET INCOME'}  : Rp ${data.summary.netIncome.toLocaleString()}</B>
<C>--------------------------------
${!data.isAgentView && data.staffBreakdown?.length > 0 ? '<C><B>PERFORMA STAFF</B>\n' : ''}`;

  if (!data.isAgentView && data.staffBreakdown?.length > 0) {
    data.staffBreakdown.forEach((s: any) => {
      payload += `<L>${(s.name || s.username).substring(0, 12).padEnd(12)} : ${s.count} trx\n`;
    });
  }

  payload += `
<C>--------------------------------
<C>Buroq Sarana Informatika
<C>
\n\n\n\n`;

  try {
    await BLEPrinter.init();
    await BLEPrinter.connectPrinter(mac);

    // Give a tiny delay after connecting for stability
    await new Promise(r => setTimeout(r, 300));

    // Print logo at the top
    await printLogo();

    return new Promise((resolve, reject) => {
      BLEPrinter.printText(
        payload,
        { beep: true, cut: true, tailingLine: false, encoding: 'UTF8', keepConnection: false },
        () => resolve(true),
        (err: Error) => {
          console.error('PrintReportText error', err);
          reject(err);
        }
      );
    });
  } catch (error) {
    console.error('PrintReport failed', error);
    throw error;
  }
};

export const printTest = async () => {
  const mac = await getPrinterMac();
  if (!mac) {
    throw new Error('Printer belum disetting.');
  }

  const payload = `<C>--------------------------------
<C>--------------------------------
<C><B>PRINTER TEST</B>
<C>--------------------------------
<C>Koneksi Berhasil!
<C>--------------------------------
<L>Printer : ${mac}
<L>Tanggal : ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
<L>Jam     : ${new Date().toLocaleTimeString('id-ID')}
<C>--------------------------------
\n\n\n`;

  try {
    await BLEPrinter.init();
    await BLEPrinter.connectPrinter(mac);

    // Give a tiny delay after connecting for stability
    await new Promise(r => setTimeout(r, 300));

    // Print logo at the top
    await printLogo();

    return new Promise((resolve, reject) => {
      BLEPrinter.printText(
        payload,
        { beep: true, cut: true, tailingLine: false, encoding: 'UTF8', keepConnection: false },
        () => resolve(true),
        (err: Error) => {
          console.error('PrintTestText error', err);
          reject(err);
        }
      );
    });
  } catch (error) {
    console.error('PrintTest failed', error);
    throw error;
  }
};
