const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration
const SONG_TITLE = "New Track Title"; // Update this
const DOWNLOAD_LINK = process.env.SONG_DOWNLOAD_URL || "https://link.to/song";
const SUBJECT = "🚨 The Song is OUT NOW!";

async function blastEmail() {
  console.log('🚀 Starting Email Blast...');

  // 1. Setup Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  // 2. Get Subscribers
  // TODO: Fetch from DB or Stripe
  // For now, using a mock list or reading from a file
  const subscribers = [
    // "fan1@example.com", 
    // "fan2@example.com" 
    process.env.TEST_EMAIL // Safety first: Send to test email only initially
  ].filter(Boolean);

  if (subscribers.length === 0) {
    console.log('❌ No subscribers found (or TEST_EMAIL not set).');
    return;
  }

  // 3. Attachments
  const attachments = [];
  // Example: attachments.push({ path: '/path/to/image.jpg' });
  
  // 4. Send
  for (const email of subscribers) {
    try {
      await transporter.sendMail({
        from: '"Handsome" <music@handsome.com>',
        to: email,
        subject: SUBJECT,
        text: `The wait is over.\n\n"${SONG_TITLE}" is out now.\n\nListen here: ${DOWNLOAD_LINK}\n\n- Handsome`,
        html: `
          <div style="font-family: sans-serif; text-align: center;">
            <h1>🚨 IT'S HERE</h1>
            <p>The new track <strong>${SONG_TITLE}</strong> is finally out.</p>
            <p><a href="${DOWNLOAD_LINK}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none;">LISTEN NOW</a></p>
            <br>
            <img src="cid:unique@image" alt="Cover Art" style="max-width: 100%;" />
          </div>
        `,
        attachments: attachments
      });
      console.log(`✅ Sent to ${email}`);
    } catch (e) {
      console.error(`❌ Failed to send to ${email}:`, e.message);
    }
  }

  console.log('🏁 Blast Complete.');
}

blastEmail();
