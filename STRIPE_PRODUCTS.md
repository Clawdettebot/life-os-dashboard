# Stripe Product IDs for Shop Items

## Created on 2026-02-18

| Product Name | Stripe Product ID | Price |
|--------------|-------------------|-------|
| SMFWP | `prod_U036CS96nq1QNd` | $70.00 |
| lil guap | `prod_U036A1yi9HsVQ7` | $40.00 |
| The Falcon & The Dogg: FLOSS PACK | `prod_U036ZJfuhcDwor` | $9.99 |
| Scam Girl Tour Hoodie | `prod_U036gsOivKdSmn` | $59.99 |
| I ❤️ Adobo Apron | `prod_U036zob1xJrNPT` | $45.00 |

## Database Update Needed

Add these columns to `shop_item` table:
```sql
ALTER TABLE shop_item 
ADD COLUMN stripe_product_id TEXT,
ADD COLUMN stripe_price_id TEXT;
```

Then update each item with their Stripe product ID.

## Notes
- All products are live in Stripe (not test mode)
- Products have images from Supabase storage
- Prices are set as one-time payments
- Inventory/sizes can be managed in Stripe dashboard or database
