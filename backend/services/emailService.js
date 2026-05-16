const axios = require('axios');
const { BREVO_API_KEY, EMAIL_FROM_NAME, EMAIL_USER } = require('../config/env');

/**
 * emailService — uses Brevo's Transactional Email REST API (HTTPS port 443).
 *
 * This approach bypasses all SMTP port restrictions since it sends over
 * regular HTTPS (port 443), which is never blocked by ISPs or routers.
 *
 * Required .env variables:
 *   BREVO_API_KEY  — from brevo.com → Settings → API Keys → Generate
 *   EMAIL_USER     — your sender email (must be verified in Brevo)
 *   EMAIL_FROM_NAME — optional display name (default: "PriceSniper 🎯")
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * sendPriceAlert
 * Sends an HTML email via Brevo REST API notifying the user that a tracked
 * product has hit (or dropped below) their target price.
 *
 * @param {string} toEmail  - Recipient email address
 * @param {object} product  - Mongoose Product document
 */
const sendPriceAlert = async (toEmail, product) => {
  const apiKey = BREVO_API_KEY;

  if (!apiKey) {
    console.warn('[emailService] BREVO_API_KEY not set — skipping email.');
    return;
  }

  const currency = product.currency || '$';
  const currentPrice = `${currency}${product.currentPrice.toFixed(2)}`;
  const targetPrice  = `${currency}${product.targetPrice.toFixed(2)}`;
  const senderName   = EMAIL_FROM_NAME || 'PriceSniper';
  const senderEmail  = EMAIL_USER;

  const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>PriceSniper Alert</title>
    </head>
    <body style="margin:0;padding:0;background:#ffffff;font-family:'Inter',Arial,sans-serif;color:#111827;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background:#F97316;padding:32px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">PriceSniper 🎯</span>
                        <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Your smart discount tracker</p>
                      </td>
                      <td align="right">
                        <span style="background:rgba(255,255,255,0.2);color:#fff;font-size:12px;font-weight:700;padding:8px 16px;border-radius:50px;text-transform:uppercase;letter-spacing:0.5px;">Price Alert</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#F97316;text-transform:uppercase;letter-spacing:1px;">Great news!</p>
                  <h1 style="margin:0 0 24px;font-size:28px;font-weight:800;color:#111827;line-height:1.2;letter-spacing:-0.5px;">
                    Target price hit!
                  </h1>
                  <!-- Product Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #f3f4f6;margin-bottom:32px;overflow:hidden;">
                    ${product.image ? `
                    <tr>
                      <td style="padding:32px;text-align:center;background:#f9fafb;">
                        <img src="${product.image}" alt="${product.title}" style="max-height:200px;max-width:100%;object-fit:contain;" />
                      </td>
                    </tr>` : ''}
                    <tr>
                      <td style="padding:32px;">
                        <p style="margin:0 0 20px;font-size:16px;font-weight:600;color:#111827;line-height:1.5;">${product.title}</p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="width:50%;padding:20px;background:#fef3c7;border-radius:16px;text-align:center;">
                              <p style="margin:0;font-size:12px;font-weight:700;color:#92400e;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Current Price</p>
                              <p style="margin:0;font-size:32px;font-weight:800;color:#F97316;">${currentPrice}</p>
                            </td>
                            <td style="width:12px;"></td>
                            <td style="width:50%;padding:20px;background:#d1fae5;border-radius:16px;text-align:center;">
                              <p style="margin:0;font-size:12px;font-weight:700;color:#065f46;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Your Target</p>
                              <p style="margin:0;font-size:32px;font-weight:800;color:#10b981;">${targetPrice}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <!-- CTA -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${product.url}" target="_blank"
                           style="display:inline-block;background:#F97316;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:18px 48px;border-radius:14px;letter-spacing:0.3px;box-shadow:0 4px 14px 0 rgba(249,115,22,0.39);">
                          🛒 Buy Now Before It Goes Up
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:32px;background:#f9fafb;border-top:1px solid #f3f4f6;">
                  <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;line-height:1.6;">
                    You're receiving this because you set a target price alert on PriceSniper.<br/>
                    <a href="${product.url}" style="color:#F97316;text-decoration:none;font-weight:600;">View Product on Web</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: toEmail }],
    subject: `🔥 Price Alert: ${product.title.slice(0, 60)} is now ${currentPrice}!`,
    htmlContent: htmlBody,
  };

  const response = await axios.post(BREVO_API_URL, payload, {
    headers: {
      'accept':       'application/json',
      'api-key':      apiKey,
      'content-type': 'application/json',
    },
  });

  console.log(`[emailService] Alert sent to ${toEmail} — Brevo messageId: ${response.data.messageId}`);
};

module.exports = { sendPriceAlert };
