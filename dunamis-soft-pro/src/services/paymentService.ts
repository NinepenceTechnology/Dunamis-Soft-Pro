import { auditService } from "./auditService";

export interface PaymentPrompt {
  amount: number;
  currency: string;
  provider: 'mpesa' | 'emola';
  phoneNumber: string;
  orderId: string;
}

export const paymentService = {
  // Simulate M-Pesa/E-Mola Push STK prompt
  async requestPayment(prompt: PaymentPrompt): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    auditService.log('payment_request', prompt);
    
    // Simulate real API latency
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulation of actual response from Vodacom/Movitel gateway
    const isSuccess = Math.random() > 0.1; // 90% success rate for simulation

    if (isSuccess) {
      const transactionId = `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      auditService.log('payment_success', { orderId: prompt.orderId, transactionId });
      return { success: true, transactionId };
    } else {
      const error = 'Pagamento recusado pelo utilizador ou saldo insuficiente.';
      auditService.log('payment_failure', { orderId: prompt.orderId, error });
      return { success: false, error };
    }
  },

  // Helper for formatting Thermal Receipt (ESC/POS compatible)
  printThermalReceipt(invoice: any) {
    const separator = "--------------------------------";
    const header = [
      "      DUNAMIS BARBERSHOP       ",
      "     Gestao Profissional       ",
      separator,
      `DATA: ${new Date().toLocaleString()}`,
      `FATURA: ${invoice.invoiceNumber}`,
      separator,
    ];

    const body = invoice.items.map((item: any) => {
      const name = item.name.padEnd(20).substring(0, 20);
      const price = `${item.price} MT`.padStart(12);
      return `${name}${price}`;
    });

    const footer = [
      separator,
      `SUBTOTAL: ${invoice.subtotal} MT`.padStart(32),
      `IVA (16%): ${invoice.tax} MT`.padStart(32),
      `TOTAL: ${invoice.total} MT`.padStart(32),
      separator,
      "      OBRIGADO PELA VISITA     ",
      "     VOLTE SEMPRE A DUNAMIS    ",
    ];

    const content = [...header, ...body, ...footer].join("\n");
    console.log("SENDING TO THERMAL PRINTER (80mm):", content);
    
    // In a real environment with a thermal printer:
    // 1. Send via Web Bluetooth (for mobile apps)
    // 2. Or open a hidden iframe and use window.print()
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; width: 300px;">${content}</pre>`);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  }
};
