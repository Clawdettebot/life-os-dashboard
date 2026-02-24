# Sir Clawthchilds' DOJO

## Mistakes & Lessons Learned

### 1. Adding Everything
**Mistake:** Added every single transaction to Life OS
**Lesson:** Only recurring payments matter. One-time purchases clutter the system.

### 2. Ignoring Small Amounts
**Mistake:** Dismissed $2.99 charges as "too small to matter"
**Lesson:** Over a year, $2.99/month = $36/year. Small subscriptions add up!

### 3. Duplicate Detection
**Mistake:** Added same subscription twice from different email addresses
**Lesson:** Always check existing subscriptions by merchant name + amount before adding new.

### 4. Not Tracking Cancellation
**Mistake:** Subscription shows as "active" forever
**Lesson:** When email says "cancelled" or "ended", update status in Life OS.

### 5. Wrong Categories
**Mistake:** Categorized Apple Music as "entertainment" when it's "subscription"
**Lesson:** Use consistent categories: income, subscription, expense, investment

### 6. Email Rate Limits
**Mistake:** Scanned 1000 emails at once, got rate limited
**Lesson:** Batch requests, respect Gmail API limits (100/day for free tier)

### 7. Not Using Labels
**Mistake:** Left emails unlabeled, had to rescan
**Lesson:** Always apply Gmail labels after processing.

## Processing Rules

### Email Parsing

#### Subject Line Keywords
```
Income: "payout", "deposit", "paid", " earnings", "refund"
Expense: "charge", "payment", "purchase", "bought"
Subscription: "subscription", "monthly", "yearly", "renewal", "billing"
Cancellation: "cancelled", "ended", "expired", "subscription ended"
Alert: "unusual", "suspicious", "large transaction"
```

#### Amount Extraction
- Look for: $XX.XX, $X,XXX.XX, USD XX.XX
- Handle: "−$10.00" (negative = refund/credit)
- Ignore: percentages, points, "free"

#### Merchant Name
- From: sender email domain
- Subject: first meaningful words
- Receipt: line items

### Categorization Logic

```
IF amount < $1 → IGNORE
IF contains "refund" OR "payout" → INCOME
IF same merchant + same amount + >1 occurrence → RECURRING
IF contains "subscription" OR "monthly" → SUBSCRIPTION
IF large unexpected amount (>$500) → FLAG FOR REVIEW
IF unknown merchant → FLAG FOR REVIEW
```

### State Management

```javascript
// Track known subscriptions
knownSubscriptions = {
  "Netflix": { amount: 15.99, category: "entertainment", status: "active" },
  "iCloud": { amount: 2.99, category: "subscription", status: "active" }
}

// When scanning new email:
// 1. Extract merchant + amount
// 2. Check if exists in knownSubscriptions
// 3. If new → add to list, notify
// 4. If cancelled → mark status: "ended"
// 5. If amount changed → update, notify
```

### Report Formats

#### Daily Summary
```
📊 **SIR CLAWTHCHILD'S DAILY** - Feb 24
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Income: $XXX.XX
Expenses: $XXX.XX
Net: $XXX.XX (+/-)

New Subscriptions: X
Cancelled: X

⚠️ Items of Note:
- $XX.XX charge from [Merchant] - verify?
- Subscription [X] renews tomorrow
```

#### Weekly Report
```
👑 **WEEKLY FINANCIAL REPORT** - Feb 17-24
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Income: $X,XXX.XX
Total Expenses: $XXX.XX
Net: $XXX.XX (+/- X%)

📈 Top Expense Categories:
1. Subscriptions: $XX.XX
2. Food: $XX.XX
3. Utilities: $XX.XX

🔄 Subscription Changes:
+ Added: Netflix ($15.99)
- Ended: Adobe ($54.99)

💡 Recommendations:
- You're paying $X/month for unused subscriptions
- Consider canceling [X] to save $X/month
```

### Email Search Queries

```javascript
// For Gmail API search
const queries = {
  twitch: 'from:twitch.tv OR from:twitchpayouts@',
  stripe: 'from:stripe.com',
  chase: 'from:chase.com',
  cashapp: 'from:cash.app OR from:squareup.com',
  shopify: 'from:shopify.com OR from:orders@',
  att: 'from:att.com',
  tmobile: 'from:t-mobile.com',
  zillow: 'from:zillow.com',
  apple: 'from:apple.com OR from:itunes'
};

// Combine with time filter
const dateFilter = 'after:' + sevenDaysAgo;
const combinedQuery = `(${queries.stripe}) ${dateFilter}`;
```
