---
title: "The Modular Monolith: Best of Both Worlds"
description: "Why most teams need the organizational benefits of microservices without the operational complexity. A pragmatic approach to architecture that actually works."
publishDate: 2024-07-15
tags: ["architecture", "microservices", "monolith", "consulting", "system-design"]
draft: false
---

Microservices are having a hangover.

After three years of everyone rushing to break apart their systems, reality hit. Teams of 10 developers managing 30 services. Distributed transactions that nobody understands. AWS bills that make CFOs cry.

Here's the thing.

You probably don't need microservices. But you do need good architecture. And that's where the modular monolith comes in.

## The False Binary

We've been sold a lie. Either you have a "legacy monolith" (bad) or "modern microservices" (good). No middle ground.

Bullshit.

I keep seeing the same story. Early-stage startup. CTO reads all the engineering blogs. "We'll build it right from day one. Scalable from the start."

So they split by entities. User service. Product service. Order service. Payment service. Notification service. Before they even know their bounded contexts. Before they have customers to scale for.

Two months in, it's already a mess. They panic-hire a DevOps engineer. Three months later, the frontend makes 15 API calls to render the dashboard. One customer complaint takes three hours to investigate across scattered logs and missing traces.

The CTO insists this is "best practice." The team is drowning. Features that should take days take weeks.

What they actually need? One deployable with clear module boundaries. But nobody wants to hear that. It's not sexy. It doesn't sell conference tickets.

## What Makes It Modular

A modular monolith isn't just a monolith with folders.

Real modularity requires discipline. Each module owns its database schema. No shared tables. No cross-module queries. Think of it like microservices that happen to share a runtime.

```
app/
├── modules/
│   ├── billing/
│   │   ├── api/
│   │   ├── domain/
│   │   ├── repository/
│   │   └── schema.sql
│   ├── users/
│   │   ├── api/
│   │   ├── domain/
│   │   ├── repository/
│   │   └── schema.sql
│   └── inventory/
│       ├── api/
│       ├── domain/
│       ├── repository/
│       └── schema.sql
```

Each module communicates through well-defined interfaces. Not HTTP. Not message queues. Just function calls. But disciplined function calls.

The billing module can't import from `users/repository`. It goes through `users/api`. Always.

## Database Separation Without Drama

"But how do you handle transactions across modules?"

Same database. Different schemas. PostgreSQL makes this beautiful.

```sql
-- Billing module sees only billing schema
SET search_path TO billing;

-- Users module sees only users schema  
SET search_path TO users;

-- Cross-module operations use explicit schemas
BEGIN;
UPDATE users.accounts SET credit = credit - 100 WHERE id = $1;
INSERT INTO billing.transactions (account_id, amount) VALUES ($1, 100);
COMMIT;
```

You get transaction consistency when you need it. Module isolation when you don't. No distributed transaction coordinators. No eventual consistency headaches.

But here's the key: these cross-module transactions are rare. Most operations stay within module boundaries. When they don't, you handle them explicitly at the application level.

## The Migration Path Nobody Talks About

Everyone writes about monolith-to-microservices. Nobody admits that sometimes you need to go backwards.

Consider a typical scenario. Team goes full microservices in 2022. By early 2024, they're drowning. 8 developers. 35+ services. More time spent on infrastructure than features.

The migration back is counterintuitive but effective:

First, consolidate services that always deploy together anyway. The user service and profile service? They never change independently. One module now.

Next, replace HTTP calls with library calls. Keep the same interfaces. Just remove the network.

Then merge the databases. Separate schemas. Same PostgreSQL instance. This alone can save $3000/month on RDS costs.

Finally, unify the deployment. One container. One pipeline. One set of environment variables.

The result? Same functionality. 70% less operational overhead. Developers actually ship features again instead of debugging distributed systems.

## When Modules Become Services

A modular monolith isn't forever. It's a stepping stone.

Some modules will need to become services. But now you have data to make that decision. You know which modules change frequently. Which ones need different scaling characteristics. Which teams really need independence.

Example: a notification module sending 10 million emails daily while the rest of the system handles 1000 requests per hour. Clear scaling mismatch. With clean module boundaries, extracting it into a service takes days, not months.

That's the power. You defer the complexity until you need it. And when you need it, you're ready.

## Implementation Patterns That Work

**Module Communication**

Don't use events for everything. In-process method calls are fine. Just version your internal APIs:

```go
// users/api/v1/service.go
type UserService interface {
    GetUser(ctx context.Context, id string) (*User, error)
    // v1 methods
}

// users/api/v2/service.go  
type UserServiceV2 interface {
    UserService // embed v1
    GetUserWithPreferences(ctx context.Context, id string) (*UserDetail, error)
    // v2 additions
}
```

Modules depend on interfaces, not implementations. Upgrade when ready.

**Testing Boundaries**

Each module gets its own test database schema:

```go
func TestBillingModule(t *testing.T) {
    db := setupTestDB(t)
    db.Exec("CREATE SCHEMA billing_test")
    db.Exec("SET search_path TO billing_test")
    // Test in isolation
}
```

Integration tests run all modules together. But most tests don't need to.

**Code Organization**

Keep modules truly independent:

```go
// ✅ Good: explicit contracts
package billing

import "myapp/modules/users/api"

func ChargeCreditCard(userAPI api.UserService, userID string) error {
    user, err := userAPI.GetUser(ctx, userID)
    // ...
}

// ❌ Bad: reaching into internals
package billing

import "myapp/modules/users/repository"

func ChargeCreditCard(userID string) error {
    user := repository.FindUserByID(userID) // No!
    // ...
}
```

The compiler won't stop you from breaking module boundaries. Discipline will.

## The Business Case

Let's talk money and time. Because that's what actually matters.

**Operational Costs**

- Microservices (15 services): ~$4000/month AWS
- Modular monolith (same scale): ~$1200/month AWS

That's $33,600 saved annually. For a seed-stage startup, that's another month of runway. Even for Series A, it's money better spent on product.

**Developer Productivity**

- Local development setup: 5 minutes vs 2 hours
- Full test suite runs in 10 minutes instead of 45
- Debugging? Direct stack traces beat distributed tracing every time

Teams report getting back 20-30% of their engineering time just from reduced operational overhead.

**Time to Market**

New feature touching 3 modules:
- Microservices: 3 PRs, 3 deployments, coordination meetings
- Modular monolith: 1 PR, 1 deployment, ship it

The feedback loop tightens. You ship faster. Customers happier.

## Making the Decision

So when should you use a modular monolith?

If you have fewer than 50 developers, start here. Even with 100 developers, you might not need microservices. Amazon ran on a monolith until 2001. They had hundreds of developers.

If your modules have different scaling needs TODAY (not theoretically), consider services. If your notification system processes millions while your admin panel serves dozens, that's a clear boundary.

If you need different tech stacks per module, services make sense. But "we might want to use Rust someday" isn't a reason. "Our ML pipeline requires Python while our API needs Go" is.

If you have true organizational boundaries with teams in different time zones who never talk, services provide necessary isolation. But if your "teams" eat lunch together, you don't need network boundaries.

## The Path Forward

The modular monolith isn't sexy. It won't get you conference talks. VCs won't be impressed by your "modern architecture."

But it will let you ship. Fast. Reliably. Cheaply.

The pattern is clear. Companies succeed with boring modular monoliths more often than with exciting microservices. The ones that eventually need microservices? They'll know. The scaling pain will be real, not theoretical.

Start with a modular monolith. Grow into services if needed. Most won't need to.

Your future self will thank you. Your team will thank you. Your CFO will definitely thank you.

And you'll be shipping features while your competitors are still debugging distributed transactions.

Considering a modular monolith approach? I help teams design architectures that match their actual needs, not industry hype.