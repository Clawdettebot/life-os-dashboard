#!/usr/bin/env node
// Email Auto-Sorter - Run with: node email-sorter.js

const Imap = require('imap');
const fs = require('fs');

const CONFIG = {
  user: 'guapdad@gmail.com',
  password: 'pitawzpiezdbufgu',
  host: 'imap.gmail.com',
  port: 993
};

const STATE_FILE = '/root/.openclaw/workspace/dashboard/.email-sorter-state.json';

const RULES = {
  Social: ['linkedin', 'facebook', 'twitter.com', 'x.com', 'instagram', 'tiktok', 'youtube', 'snapchat', 'pinterest'],
  Newsletter: ['noreply@', 'newsletter', 'digest', 'updates@', 'notifications@', 'weekly', 'monthly', 'subscribe', 'mailchimp', 'substack'],
  Business: ['invoice', 'payment', 'receipt', 'order', 'shipment', 'amazon', 'shopify', 'stripe', 'paypal', 'zelle', 'venmo', 'gumroad', 'rootin', 'booking', 'grailed', 'ebay'],
  Personal: ['guapdad', 'family', 'mom', 'dad', 'brother', 'sister', 'friend', 'gmail.com', 'yahoo.com', 'icloud.com', 'beat', 'prod', 'track', 'feature', 'collab', 'song', 'music', 'video', 'show', 'tour']
};

function getState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE));
    }
  } catch(e) {}
  return { position: 1 };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state));
}

async function sortEmails(limit = 100) {
  const state = getState();
  const startPos = state.position;
  const endPos = startPos + limit - 1;
  
  console.log(`Scanning emails ${startPos} to ${endPos}...`);
  
  const imap = new Imap({
    user: CONFIG.user,
    password: CONFIG.password,
    host: CONFIG.host,
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  });

  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) { reject(err); return; }
        
        const total = box.messages.total;
        if (startPos > total) {
          console.log('Reached end of inbox, resetting to beginning...');
          state.position = 1;
          saveState(state);
          imap.end();
          resolve(0);
          return;
        }
        
        const scanEnd = Math.min(endPos, total);
        
        const f = imap.seq.fetch(startPos + ':' + scanEnd, { bodies: 'HEADER.FIELDS (FROM SUBJECT)', struct: false });
        const uidsByCategory = { Social: [], Newsletter: [], Business: [], Personal: [] };
        
        f.on('message', (msg) => {
          let from = '', subject = '';
          
          msg.on('body', (stream) => {
            let data = '';
            stream.on('data', (chunk) => { data += chunk; });
            stream.on('end', () => {
              from = (data.match(/From: (.+)/)?.[1] || '').toLowerCase();
              subject = (data.match(/Subject: (.+)/)?.[1] || '').toLowerCase();
            });
          });
          
          msg.once('attributes', (attrs) => {
            const uid = attrs.uid;
            const flags = attrs.flags || [];
            if (flags.includes('\\Seen')) return;
            
            for (const [cat, keywords] of Object.entries(RULES)) {
              if (keywords.some(k => from.includes(k) || subject.includes(k))) {
                uidsByCategory[cat].push(uid);
                break;
              }
            }
          });
        });
        
        f.on('end', async () => {
          let moved = 0;
          for (const [folder, uids] of Object.entries(uidsByCategory)) {
            if (uids.length === 0) continue;
            try {
              await new Promise((res, rej) => {
                imap.move(uids, folder, (err) => err ? rej(err) : res());
              });
              console.log(`Moved ${uids.length} to ${folder}`);
              moved += uids.length;
            } catch(e) { console.log(`Error: ${e.message}`); }
          }
          
          // Update position for next run
          state.position = scanEnd + 1;
          saveState(state);
          
          console.log(`Done! Sorted ${moved} emails (next position: ${state.position})`);
          imap.end();
          resolve(moved);
        });
      });
    });
    
    imap.once('error', (err) => reject(err));
    imap.connect();
  });
}

sortEmails().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
