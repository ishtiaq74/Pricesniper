const axios = require('axios');

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
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn('[emailService] BREVO_API_KEY not set — skipping email.');
    return;
  }

  const currency = product.currency || '$';
  const currentPrice = `${currency}${product.currentPrice.toFixed(2)}`;
  const targetPrice  = `${currency}${product.targetPrice.toFixed(2)}`;
  const senderName   = process.env.EMAIL_FROM_NAME || 'PriceSniper';
  const senderEmail  = process.env.EMAIL_USER;

  const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>PriceSniper Alert</title>
    </head>
    <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Inter',Arial,sans-serif;color:#f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#FF8C00,#e07a00);padding:28px 32px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">🎯 PriceSniper</span>
                        <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">Your smart discount tracker</p>
                      </td>
                      <td align="right">
                        <span style="background:rgba(255,255,255,0.2);color:#fff;font-size:12px;font-weight:700;padding:6px 14px;border-radius:50px;">PRICE ALERT</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:32px;">
                  <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Great news!</p>
                  <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                    A product you're tracking has hit your target price!
                  </h1>
                  <!-- Product Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2d2d2d;margin-bottom:28px;overflow:hidden;">
                    ${product.image ? `
                    <tr>
                      <td style="padding:20px;text-align:center;background:#111111;border-bottom:1px solid #2d2d2d;">
                        <img src="${product.image}" alt="${product.title}" style="max-height:160px;max-width:100%;object-fit:contain;border-radius:8px;" />
                      </td>
                    </tr>` : ''}
                    <tr>
                      <td style="padding:20px;">
                        <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#f9fafb;line-height:1.4;">${product.title}</p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="width:50%;padding:12px;background:#0f0f0f;border-radius:10px;text-align:center;">
                              <p style="margin:0;font-size:11px;color:#6b7280;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Current Price</p>
                              <p style="margin:0;font-size:26px;font-weight:800;color:#FF8C00;">${currentPrice}</p>
                            </td>
                            <td style="width:4px;"></td>
                            <td style="width:50%;padding:12px;background:#0f0f0f;border-radius:10px;text-align:center;">
                              <p style="margin:0;font-size:11px;color:#6b7280;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Your Target</p>
                              <p style="margin:0;font-size:26px;font-weight:800;color:#10b981;">${targetPrice}</p>
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
                           style="display:inline-block;background:linear-gradient(135deg,#FF8C00,#e07a00);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                          🛒 Buy Now Before It Goes Up
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:20px 32px;border-top:1px solid #1f2937;">
                  <p style="margin:0;font-size:12px;color:#4b5563;text-align:center;">
                    You're receiving this because you set a target price alert on PriceSniper.<br/>
                    <a href="${product.url}" style="color:#FF8C00;text-decoration:none;">View Product</a>
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
