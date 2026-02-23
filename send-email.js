#!/usr/bin/env node
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  user: 'guapdad@gmail.com',
  pass: 'pitawzpiezdbufgu' // App password
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: CONFIG.user,
    pass: CONFIG.pass
  }
});

const IMAGE_PATH = '/root/.openclaw/media/inbound/857ac2b2-de39-475c-b50a-af82a0cbc637.png';

const mailOptions = {
  from: '"Guapdad" <guapdad@gmail.com>',
  to: 'Jake@twnshp.com',
  subject: 'Kick Onboarding - Following Up',
  text: `Hey Jake,

Hope you're good! I wanted to share this screenshot from my conversation with Kick's partner team. They redirected me to kickpartners@kick.com for the artist onboarding process.

Can you help me put together a professional intro email to send their way? Want to make sure we come correct for the team.

Thanks!
Guapdad`,
  attachments: [
    {
      filename: 'kick-dm-screenshot.png',
      path: IMAGE_PATH
    }
  ]
};

transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  console.log('Email sent:', info.response);
});
