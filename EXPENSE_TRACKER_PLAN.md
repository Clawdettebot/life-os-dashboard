# Email Expense Tracker - Project Plan

## Overview
Scan Gmail for money-related info → Store in Life OS → Display in Dashboard → Send weekly reports

---

## Phase 1: Email Scanning & Expense Detection

### 1.1 Email Scanner Script (`email-expense-scanner.js`)
**What it does:** Search Gmail for expense-related emails and extract structured data

**Search queries to implement:**
```
- "invoice" OR "receipt" OR "payment" OR "charged" 
- "subscription" OR "recurring" OR "monthly"
- "due date" OR "due on" OR "payment due"
- "bill" OR "statement" 
- "Amazon" OR "Netflix" OR "Spotify" OR "Apple" (known subs)
- "bank" OR "transaction" OR "withdrawal"
```

**Data extraction:**
- Amount detection (regex: $XX.XX, XX.XX, etc.)
- Vendor/Merchant name
- Date of transaction
- Category (auto-guess based on vendor/keywords)
- Recurring detection (monthly, yearly, weekly)
- Due date extraction

### 1.2 Categories
```javascript
const CATEGORIES = {
  streaming: ['netflix', 'spotify', 'hulu', 'disney', 'hbo', 'youtube premium'],
  tech: ['aws', 'digitalocean', 'github', 'figma', 'adobe', 'apple'],
  utilities: ['electric', 'gas', 'water', 'internet', 'phone', 'verizon', 'att'],
  insurance: ['geico', 'state farm', 'allstate', 'insurance'],
  shopping: ['amazon', 'ebay', 'etsy', 'walmart', 'target'],
  food: ['doordash', 'uber eats', 'grubhub', 'postmates'],
  finance: ['bank', 'transfer', 'fee', 'interest'],
  other: []
};
```

### 1.3 Data Storage
**Extend `finances.json` schema:**
```javascript
{
  "id": "xxx",
  "title": "Netflix",
  "amount": 15.99,
  "type": "expense", // or "income"
  "category": "streaming",
  "vendor": "Netflix",
  "date": 1771490400000,
  "dueDate": 1771490400000, // for bills
  "recurring": {
    "is_recurring": true,
    "frequency": "monthly", // weekly, monthly, quarterly, yearly
    "nextDue": 1774078800000
  },
  "source": "email", // "manual" or "email"
  "emailSubject": "Netflix.com billing statement",
  "emailFrom": "billing@netflix.com",
  "tags": ["subscription", "streaming"],
  "notes": "",
  "created_at": 1771490400000,
  "detected_at": 1771490400000 // when we found it
}
```

---

## Phase 2: Money Opportunities & Reminders

### 2.1 Opportunity Detection
**Search queries:**
```
- "payment received" OR "payment sent" 
- "invoice paid" 
- "refund" OR "reimbursement"
- "bonus" OR "commission" OR "earnings"
- "opportunity" OR "deal" OR "investment"
- "urgent" OR "follow up" OR "action required"
```

### 2.2 Opportunity Schema
```javascript
{
  "id": "xxx",
  "type": "opportunity", // "payment", "refund", "follow-up", "urgent"
  "title": "Refund from Amazon",
  "description": "...",
  "amount": 49.99,
  "source": "amazon@amazon.com",
  "subject": "Your refund has been processed",
  "emailId": "abc123",
  "action": "none", // "none", "follow-up", "claim"
  "status": "pending", // "pending", "claimed", "dismissed"
  "reminderDate": 1771576800000,
  "created_at": 1771490400000
}
```

### 2.3 Reminder System
- Store in `data/reminders.json`
- Check during heartbeats
- Send alerts for urgent items
- Mark as done when action taken

---

## Phase 3: Dashboard UI

### 3.1 New View: Expenses
Add to `client/src/components/ExpensesView.js`:

**Features:**
- Table of all detected expenses
- Filter by: category, date range, recurring vs one-time
- Group by: month, category, vendor
- Summary stats: total monthly, by category
- "Add Manual" button
- "Rescan Emails" button
- Mark as recurring manually

### 3.2 New View: Opportunities
- List of detected opportunities
- Action buttons: "Claim", "Dismiss", "Set Reminder"
- Filter by status

### 3.3 Finance View Enhancement
- Add "Recurring Expenses" section
- Add "Upcoming Bills" section (next 30 days)
- Show "Email-Detected" badge on items

---

## Phase 4: Weekly Reports

### 4.1 Report Generation
```javascript
// Weekly report includes:
- Total expenses detected this week
- New subscriptions found
- Upcoming bills (next 7 days)
- Opportunities requiring action
- Comparison to last week
```

### 4.2 Delivery
- Cron job: Every Sunday at 6pm
- Send via Discord (cortex channel or DM)
- Also store in dashboard

---

## Implementation Order

1. ✅ Gmail OAuth (DONE)
2. 📝 Create `email-expense-scanner.js` - Core scanning logic
3. 📝 Add API endpoints for scanning + opportunities
4. 📝 Create `ExpensesView.js` component
5. 📝 Update FinanceView with recurring/upcoming sections
6. 📝 Add opportunity tracking + reminders
7. 📝 Weekly report cron job

---

## Files to Create/Modify

**New Files:**
- `email-expense-scanner.js` - Main scanner
- `client/src/components/ExpensesView.js` - New view
- `client/src/components/OpportunitiesView.js` - New view

**Modify:**
- `server.js` - Add /api/scan-expenses, /api/opportunities endpoints
- `client/src/App.js` - Add new views to routing
- `data/finances.json` - Already exists, auto-extended
- `data/opportunities.json` - New file
- `data/reminders.json` - New file
