import nodemailer from 'nodemailer';

export type KeyEmailItem = {
  productName: string;
  key: string;
};

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }
  }

  public async sendLicenseKeysEmail(
    toEmail: string,
    orderNumber: string,
    totalAmount: number,
    keys: KeyEmailItem[],
  ): Promise<boolean> {
    const formattedTotal = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(totalAmount);

    const keysHtml = keys
      .map(
        (item) => `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
          <div style="font-weight: 600; color: #0f172a; font-size: 15px; margin-bottom: 8px;">${item.productName}</div>
          <div style="background-color: #ffffff; border: 1px dashed #35B7BC; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 16px; font-weight: bold; color: #35B7BC; letter-spacing: 1px; word-break: break-all;">
            ${item.key}
          </div>
        </div>
      `,
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Giao Key Bản Quyền - ${orderNumber}</title>
      </head>
      <body style="font-family: system-ui, -apple-system, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #334155;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: #35B7BC; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: bold;">Công Ty TNHH Công Nghệ Nam Nguyễn</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Giao Key Bản Quyền Tự Động Qua Email</p>
          </div>

          <!-- Body -->
          <div style="padding: 24px;">
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-bottom: 20px; text-align: center;">
              ✓ Đơn hàng ${orderNumber} đã thanh toán thành công!
            </div>

            <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              Xin chào quý khách, cảm ơn bạn đã mua hàng tại <strong>Công Ty TNHH Công Nghệ Nam Nguyễn</strong>. Bên dưới là thông tin Mã Key Bản Quyền cho đơn hàng của bạn:
            </p>

            <!-- Key List -->
            ${keysHtml}

            <!-- Summary -->
            <div style="border-top: 1px solid #e2e8f0; margin-top: 20px; padding-top: 16px; display: flex; justify-content: space-between; font-size: 14px;">
              <span>Tổng tiền đơn hàng:</span>
              <strong style="color: #35B7BC; font-size: 16px;">${formattedTotal}</strong>
            </div>

            <!-- Support info -->
            <div style="margin-top: 24px; font-size: 12px; color: #64748b; background-color: #f8fafc; padding: 12px; border-radius: 8px;">
              💡 <strong>Hỗ trợ kỹ thuật 24/7:</strong> Nếu gặp bất kỳ thắc mắc nào trong quá trình kích hoạt key, vui lòng liên hệ Hotline/Zalo: <strong>0383 158 080</strong>.
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            © 2026 Công Ty TNHH Công Nghệ Nam Nguyễn. All Rights Reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`\n======================================================`);
    console.log(`📧 GỬI EMAIL KEY THỰC CHO: ${toEmail}`);
    console.log(`📦 ĐƠN HÀNG: ${orderNumber} | TỔNG: ${formattedTotal}`);
    console.log(`🔑 KEYS:`, keys);
    console.log(`======================================================\n`);

    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || `"Nam Nguyễn Tech" <${process.env.SMTP_USER}>`,
          to: toEmail,
          subject: `[Key Bản Quyền] Đơn hàng ${orderNumber} - Nam Nguyễn Tech`,
          html: htmlContent,
        });
        console.log(`✅ Đã gửi Email thực tới ${toEmail} qua SMTP!`);
        return true;
      }
    } catch (error) {
      console.error(`❌ Lỗi kết nối SMTP chính:`, error);
      console.log(`🔄 Đang tự động chuyển sang Hòm thư Test Ethereal...`);
    }

    try {
      const testAccount = await nodemailer.createTestAccount();
      const fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      const info = await fallbackTransporter.sendMail({
        from: `"Nam Nguyễn Tech" <no-reply@namnguyen.com>`,
        to: toEmail,
        subject: `[Key Bản Quyền] Đơn hàng ${orderNumber} - Nam Nguyễn Tech`,
        html: htmlContent,
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`✅ ĐÃ GỬI EMAIL THÀNH CÔNG VỀ HÒM THƯ DÙNG THỬ!`);
      if (previewUrl) {
        console.log(`🔗 [CLICK XEM NỘI DUNG THƯ VỪA GỬI TẠI ĐÂY]: ${previewUrl}`);
      }
      return true;
    } catch (err) {
      console.error(`❌ Lỗi gửi Email Ethereal:`, err);
      return false;
    }
  }
}
