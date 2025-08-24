---
title: "Database Indexing Strategies for High-Performance Applications"
description: "Understanding when and how to use different types of database indexes"
publishDate: 2025-08-08
tags: ["database", "performance", "sql", "optimization", "postgresql"]
draft: false
---

Proper indexing can make the difference between queries that take milliseconds and those that take minutes. Let's dive deep into indexing strategies.

## Index Types Comparison

| Index Type | Use Case         | Read Speed | Write Speed | Space     | PostgreSQL | MySQL | MongoDB |
| ---------- | ---------------- | ---------- | ----------- | --------- | ---------- | ----- | ------- |
| B-Tree     | General purpose  | Fast       | Medium      | Medium    | ✅         | ✅    | ✅      |
| Hash       | Equality checks  | Very Fast  | Fast        | Low       | ✅         | ✅    | ✅      |
| GiST       | Geometric data   | Medium     | Slow        | High      | ✅         | ❌    | ❌      |
| GIN        | Full-text search | Fast       | Very Slow   | Very High | ✅         | ❌    | ❌      |
| BRIN       | Large tables     | Medium     | Very Fast   | Very Low  | ✅         | ❌    | ❌      |
| Bitmap     | Low cardinality  | Fast       | Medium      | Low       | ✅         | ✅    | ❌      |

## Understanding Query Execution Plans

```sql
-- PostgreSQL EXPLAIN ANALYZE example
EXPLAIN (ANALYZE, BUFFERS)
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= '2025-01-01'
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 5
ORDER BY order_count DESC
LIMIT 10;
```

### Execution Plan Visualization

```
QUERY PLAN
─────────────────────────────────────────────────────
Limit (cost=1547.83..1547.85 rows=10)
  -> Sort (cost=1547.83..1548.33 rows=200)
        Sort Key: (count(o.id)) DESC
        -> HashAggregate (cost=1541.50..1543.50 rows=200)
              Group Key: u.id
              Filter: (count(o.id) > 5)
              -> Hash Left Join (cost=280.50..1466.50)
                    Hash Cond: (u.id = o.user_id)
                    -> Seq Scan on users u (cost=0.00..1061.00)
                          Filter: (created_at >= '2025-01-01')
                    -> Hash (cost=155.50..155.50)
                          -> Seq Scan on orders o
Planning Time: 0.284 ms
Execution Time: 47.893 ms
```

## Creating Optimal Indexes

### Composite Index Strategy

```sql
-- Bad: Multiple single-column indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created ON users(created_at);

-- Good: Composite index for common query patterns
CREATE INDEX idx_users_status_created_email
ON users(status, created_at DESC, email)
WHERE status = 'active';

-- Query that benefits from this index
SELECT email, created_at
FROM users
WHERE status = 'active'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY created_at DESC;
```

## Partial Indexes for Specific Queries

```sql
-- Index only for non-deleted records
CREATE INDEX idx_products_active
ON products(category_id, price)
WHERE deleted_at IS NULL;

-- Index for hot data
CREATE INDEX idx_orders_recent
ON orders(user_id, created_at DESC)
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days';

-- Index for specific status values
CREATE INDEX idx_payments_pending
ON payments(user_id, amount)
WHERE status IN ('pending', 'processing');
```

## JSON and Full-Text Indexes

```sql
-- PostgreSQL JSONB indexing
CREATE INDEX idx_metadata_gin ON products
USING gin (metadata);

-- Query using the index
SELECT * FROM products
WHERE metadata @> '{"category": "electronics"}';

-- Full-text search index
CREATE INDEX idx_articles_search ON articles
USING gin (to_tsvector('english', title || ' ' || content));

-- Search query
SELECT * FROM articles
WHERE to_tsvector('english', title || ' ' || content)
  @@ plainto_tsquery('english', 'database optimization');
```

## Index Maintenance

### Monitoring Index Usage

```sql
-- PostgreSQL: Find unused indexes
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find duplicate indexes
WITH index_data AS (
    SELECT
        indrelid,
        indexrelid,
        indkey,
        indisunique,
        indisprimary
    FROM pg_index
)
SELECT
    a.indexrelid::regclass AS index1,
    b.indexrelid::regclass AS index2,
    pg_size_pretty(pg_relation_size(a.indexrelid)) AS size1,
    pg_size_pretty(pg_relation_size(b.indexrelid)) AS size2
FROM index_data a
JOIN index_data b ON a.indrelid = b.indrelid
    AND a.indkey = b.indkey
    AND a.indexrelid < b.indexrelid;
```

## Index Performance Impact

### Before and After Optimization

```
Query Performance Comparison:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Without Index:
├─ Execution Time: 3,247 ms
├─ Rows Scanned: 1,000,000
├─ Buffer Hits: 45,231
└─ Disk Reads: 12,543

With Optimized Index:
├─ Execution Time: 12 ms (271x faster!)
├─ Rows Scanned: 142
├─ Buffer Hits: 156
└─ Disk Reads: 3

Index Size Impact:
├─ Table Size: 5.2 GB
├─ Total Index Size: 1.8 GB
└─ Storage Overhead: 34.6%
```

## Advanced Indexing Techniques

### Covering Indexes

```sql
-- Include non-key columns in index (PostgreSQL)
CREATE INDEX idx_orders_covering
ON orders(user_id, created_at DESC)
INCLUDE (total_amount, status);

-- Now this query is index-only scan
SELECT created_at, total_amount, status
FROM orders
WHERE user_id = 123
ORDER BY created_at DESC
LIMIT 10;
```

### Expression Indexes

```sql
-- Index on computed values
CREATE INDEX idx_users_email_lower
ON users(LOWER(email));

-- Index on date parts
CREATE INDEX idx_orders_month
ON orders(DATE_TRUNC('month', created_at));

-- Index on JSON fields
CREATE INDEX idx_products_brand
ON products((metadata->>'brand'));
```

## Index Strategy Decision Tree

```
Should I create an index?
│
├─ Is the table > 10,000 rows?
│  ├─ No → Skip index (sequential scan is fine)
│  └─ Yes → Continue
│
├─ Is the query run frequently?
│  ├─ No → Skip index (maintenance cost too high)
│  └─ Yes → Continue
│
├─ Does the query filter < 10% of rows?
│  ├─ No → Consider full table scan
│  └─ Yes → Continue
│
├─ Are writes more frequent than reads?
│  ├─ Yes → Be selective with indexes
│  └─ No → Index can help
│
└─ Will the index be used for sorting?
   ├─ Yes → Create index with proper sort order
   └─ No → Standard index is fine
```

## MongoDB Indexing

```javascript
// Compound index
db.users.createIndex({
    status: 1,
    created_at: -1,
    email: 1,
});

// Text index for search
db.articles.createIndex({
    title: "text",
    content: "text",
});

// Geospatial index
db.locations.createIndex({
    coordinates: "2dsphere",
});

// TTL index for automatic deletion
db.sessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Analyze query performance
db.orders
    .find({
        user_id: ObjectId("..."),
        status: "pending",
    })
    .explain("executionStats");
```

## Index Gotchas and Anti-Patterns

### Common Mistakes

```sql
-- ❌ Wrong: Low cardinality index
CREATE INDEX idx_users_gender ON users(gender);
-- Only 2-3 distinct values, not selective enough

-- ❌ Wrong: Indexing volatile columns
CREATE INDEX idx_products_view_count ON products(view_count);
-- Updates too frequently, causes index bloat

-- ❌ Wrong: Over-indexing
-- Having 20 indexes on a table with heavy writes

-- ✅ Right: Selective, stable columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);
```

## Performance Monitoring Dashboard

```sql
-- Create a monitoring view
CREATE VIEW index_performance AS
SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    i.relname AS index_name,
    pg_size_pretty(pg_relation_size(i.oid)) AS index_size,
    idx_scan AS scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    CASE
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'RARELY USED'
        WHEN idx_scan < 1000 THEN 'OCCASIONALLY USED'
        ELSE 'FREQUENTLY USED'
    END AS usage_category
FROM pg_stat_user_indexes
JOIN pg_class i ON i.oid = indexrelid
JOIN pg_class c ON c.oid = indrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
ORDER BY idx_scan DESC;
```

## Key Takeaways

1. **Profile before indexing** - Use EXPLAIN ANALYZE
2. **Index maintenance matters** - Regular VACUUM and REINDEX
3. **Consider write overhead** - Each index slows down INSERT/UPDATE
4. **Monitor index usage** - Remove unused indexes
5. **Think about query patterns** - Design indexes for your workload

Remember: Indexes are not free. They consume storage, slow down writes, and require maintenance. Use them wisely!
