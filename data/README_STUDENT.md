# AI SME Youth Competition ’26 — Track 1 Dataset
## Smart Hospitality: Sell More, Waste Less, Serve Better

### Revised scope
This is fully synthetic teaching data for one fictional hospitality SME ecosystem, deliberately narrowed to three core segments:
1. **Café (foundation):** menu sales, ingredients, stock, waste, promotions, and demand.
2. **Hotel (main expansion):** room nights, breakfast add-ons, late checkout, guest feedback, and room capacity.
3. **Tours (main expansion):** walking/cultural tours, market tours, cooking experiences, and river cruises, with guide/vehicle/boat capacity considerations.

**Optional supporting services:** wellness (Thai massage) and transportation (airport/city transfers). These are add-on services within the same ecosystem, not separate standalone case tracks.

The intended challenge is to help a small hospitality business **sell more, waste less, and serve guests better** over a 2.5-week build period. Teams can choose one focused business problem or build a small cross-segment prototype. No sponsor, real business, or real customer data is included.

### Files
- `products_services.csv`: Canonical product/service catalog and unit economics.
- `sales_transactions.csv`: Transaction lines for the selected segments.
- `inventory_daily.csv`: Daily stock records for café ingredients and a basic hotel consumable.
- `inventory_item_dictionary.csv`: Inventory units, typical usage, cost, and perishability.
- `daily_context.csv`: Calendar, weather, promotion, season, and synthetic demand context.
- `bookings_operations.csv`: Hotel, tour, wellness, and transport bookings.
- `customer_feedback.csv`: Synthetic ratings and text feedback from the selected segments.
- `data_quality_issue_register.csv`: Known data quality issues and investigation hints.
- `DATA_DICTIONARY.csv`: Field definitions.

### Key joins
- `sales_transactions.product_service_id` → `products_services.product_service_id`
- `bookings_operations.product_service_id` → `products_services.product_service_id`
- `inventory_daily.inventory_item_id` → `inventory_item_dictionary.inventory_item_id`
- Date fields → `daily_context.date`

### Deliberate data quality issues
Some customer IDs, stock-received values, waste quantities, ratings, and comments are missing. Some raw product/service names use inconsistent aliases. A few stock balances do not reconcile with opening + received - used - waste. The issue register identifies affected records and provides investigation hints. Document corrections and assumptions; do not silently invent values.

### Suggested challenge directions
- Café: forecast demand by day/menu item; reduce waste and stockouts; recommend prep or promotion levels.
- Hotel: forecast room demand; analyze breakfast/late-checkout add-ons; improve guest experience.
- Tours: forecast booking demand; manage capacity and cancellations; recommend bundles with hotel/café services.
- Cross-segment: build a lightweight owner dashboard or assistant that explains what to do next and why.

### Cautions
All data, locations, costs, prices, customers, and feedback are synthetic. THB amounts are illustrative. `synthetic_demand_index` is a generated context signal, not ground truth. Use chronological train/test splits for forecasting. Distinguish completed sales from refunds, cancellations, no-shows, and pending bookings. Teams may use rules, ML, generative AI, or hybrid approaches.
