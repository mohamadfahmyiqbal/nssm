// services/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Mendapatkan Access Token dari Entra ID via Client Credentials
 */
const getAccessToken = async () => {
    const tenantId = process.env.ENTRA_TENANT_ID;
    const clientId = process.env.ENTRA_CLIENT_ID;
    const clientSecret = process.env.ENTRA_CLIENT_SECRET_VALUE;
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'https://outlook.office365.com/.default');
    params.append('grant_type', 'client_credentials');

    const response = await fetch(tokenUrl, {
        method: 'POST',
        body: params
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gagal mendapatkan token: ${err}`);
    }

    const data = await response.json();
    return data.access_token;
};

/**
 * Mengirimkan email notifikasi perangkat down
 */
export const sendDeviceDownEmail = async (deviceData, time) => {
    try {
        if (!process.env.SMTP_USER || !process.env.ALERT_RECIPIENT) {
            console.warn('⚠️ [Email Service] SMTP_USER atau ALERT_RECIPIENT belum disetting di .env. Email tidak dikirim.');
            return;
        }

        const accessToken = await getAccessToken();

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.office365.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                type: 'OAuth2',
                user: process.env.SMTP_USER,
                accessToken: accessToken
            },
            tls: {
                ciphers: 'SSLv3'
            }
        });

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: process.env.ALERT_RECIPIENT,
            subject: `🚨 URGENT: Perangkat DOWN - ${deviceData.HOSTNAME} (${deviceData.IP})`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #f5c6cb; background-color: #f8d7da; color: #721c24; border-radius: 5px;">
                    <h2 style="color: #721c24; margin-top: 0;">Peringatan: Perangkat Terputus (DOWN)</h2>
                    <p>Sistem mendeteksi bahwa perangkat berikut tidak dapat dihubungi:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #f5c6cb; font-weight: bold; width: 30%;">Hostname</td>
                            <td style="padding: 8px; border: 1px solid #f5c6cb;">${deviceData.HOSTNAME || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #f5c6cb; font-weight: bold;">IP Address</td>
                            <td style="padding: 8px; border: 1px solid #f5c6cb;">${deviceData.IP || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #f5c6cb; font-weight: bold;">PID / ID</td>
                            <td style="padding: 8px; border: 1px solid #f5c6cb;">${deviceData.PID || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #f5c6cb; font-weight: bold;">Waktu Terdeteksi</td>
                            <td style="padding: 8px; border: 1px solid #f5c6cb;">${time}</td>
                        </tr>
                    </table>
                    <p style="margin-top: 20px; font-size: 12px; color: #555;">
                        <em>Email ini dikirim secara otomatis oleh Network Topology Monitoring System (NTMS). Harap jangan membalas email ini.</em>
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 [Email Service] Alert terkirim untuk ${deviceData.HOSTNAME}: ${info.messageId}`);
    } catch (error) {
        console.error('❌ [Email Service Error]: Gagal mengirim email alert.', error.message);
    }
};
