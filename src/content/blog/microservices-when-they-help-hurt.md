---
title: "Microservices: When They Help and When They Hurt"
description: "Everyone wants microservices until they have them. Here's my practical guide on when they actually make sense and when they'll destroy your productivity."
publishDate: 2023-05-03
tags: ["architecture", "microservices", "strategy", "scaling"]
draft: false
---

Everyone wants microservices. Until they actually have them.

I've seen too many teams jump into microservices because Netflix does it. News flash: you're not Netflix. You don't have their problems. Or their resources.

Let me save you months of pain with simple rules about when microservices help and when they hurt.

## When Microservices Actually Help

### Different Scaling Needs

Your auth service handles 100 req/sec. Your reporting service handles 10,000 req/sec.

Makes sense to scale them independently? Only if it's cheaper than scaling the whole monolith. Sometimes 3 bigger instances cost less than managing 2 separate services with their own infrastructure. Do the math first.

### Different Teams, Different Tech

Team A knows Python. Team B knows Go. Team C inherited a Java monster.

Microservices let each team use their strengths. But only if you actually have separate teams.

### Isolation Requirements

Payment processing needs PCI compliance. User profiles don't.

Isolate the compliance burden. Don't spread it across your entire system.

### Independent Deployment Cycles

Your experimentation platform changes daily. Your billing system changes quarterly.

Different change velocities? Different services make sense.

## When Microservices Will Hurt You

### You Have Fewer Than 20 Developers

Ten developers managing 30 services? That's not architecture. That's masochism.

One service per two developers. Maximum. Otherwise you're a full-time DevOps team that occasionally writes features.

### You Don't Have Proper DevOps

No CI/CD pipeline? No container orchestration? No service mesh? No monitoring?

Stay monolithic. Seriously.

Microservices without proper tooling is like flying without instruments. You'll crash. Just a matter of when.

### Your Domain Boundaries Aren't Clear

Can't clearly define what each service does? You'll end up with distributed spaghetti.

Worse than regular spaghetti. At least monolithic spaghetti is in one place.

### You're Early Stage

Still finding product-market fit? Your architecture will change every month.

Refactoring a monolith: annoying.
Refactoring 15 microservices: impossible.

## The Real Costs Nobody Mentions

**Distributed Systems Complexity**
- Network failures everywhere
- Eventual consistency headaches
- You'll need distributed transactions
- Service discovery becomes critical
- Don't forget circuit breakers

Each adds complexity. Together? Exponential complexity.

**Operational Overhead**
- 20 services = 20 deployments
- 20 sets of logs
- 20 things to monitor
- 20 things that can break at 3 AM

**Data Management Hell**
- Joins across services become impossible
- Data consistency? That's your new nightmare
- ACID transactions are gone

**Testing Complexity**
- Unit tests? Easy
- Integration tests? Hard
- End-to-end tests? Basically impossible

## My Practical Rules

### Start with a Modular Monolith

Build like it's microservices. Deploy like it's a monolith.

Clear module boundaries. Separate databases per module if possible. But one deployment.

This gives you 80% of microservices benefits with 20% of the pain.

### Extract Services When Pain Becomes Clear

That module that always causes problems? Extract it.

That team that needs to deploy hourly? Give them their own service.

That component eating all your CPU? Separate it.

Extract based on actual pain, not anticipated pain.

### Architecture Should Mirror Team Structure

This is Conway's Law. And it's real.

Multiple teams working on different bounded contexts? That's when microservices make sense. Each team owns their domain, their service, their deployment schedule.

One team working across multiple areas? Keep the monolith. Splitting the code when you can't split the team just creates coordination overhead.

5-8 developers per service is sustainable. 2-3 developers? They'll spend more time on DevOps than features.

### Consider the Middle Ground

Not everything is monolith vs microservices.

**Service-Oriented Architecture (SOA)**: 5-10 larger services instead of 50 tiny ones.

**Serverless for Edges**: Keep core monolithic. Use Lambda for sporadic workloads.

**Modular Monolith**: Strict boundaries, shared deployment.

## Questions to Ask Before Going Micro

1. Can you draw clear boundaries between services?
2. Do you have different scaling requirements?
3. Can you handle 10x operational complexity?
4. Do you have dedicated DevOps resources?
5. Are you solving actual problems or imaginary ones?

Less than 4 "yes" answers? Stay monolithic.

## Real-World Examples

Based on publicly available information, here's what actually happened at scale:

### Airbnb's 10-Year Journey

Started in 2008 with a Rails monolith called "Monorail". One codebase. One deployment. Simple.

This worked for 10 years. Through massive growth. Through international expansion. Through IPO preparation.

Only in 2018, with 1000+ engineers, did they move to SOA (not even microservices). Why? Deployment times reached hours. Code changes were delayed 15 hours/week due to rollbacks. They had actual pain.

The migration took years. They're still not fully microservices. They call it "service-oriented architecture" - larger services, not micro ones.

### GitHub's Monolith Success

Still runs a Rails monolith today. 2 million lines of code. 1000+ engineers. 500,000 commits.

They deploy 20 times per day. From a monolith. They upgrade Rails weekly. They adopted Ruby 3.2.1 on release day.

How? Modular architecture within the monolith. Clear boundaries. Great tooling. Proof that monoliths can scale.

### Shopify's Modular Monolith

Rails application with 2.8 million lines of code. Handles 30TB of traffic per minute on Black Friday.

Their approach? Modular monolith. They've been working on modularization for 2.5 years. Still not finished. Still one deployment.

They use "pods architecture" to shard databases by shop_id. But the application? Still monolithic. Because it works.

### Stripe's Pragmatic Evolution

Started with Ruby on AWS EC2 in 2011. Today: 15 million lines of Ruby across 150,000 files.

Did they go microservices? Partially. They rewrote PCI-sensitive components in Go for performance (150µs vs 500µs latency). Everything else? Still Ruby. Still relatively monolithic.

Why? Because most of their system doesn't need microsecond latency. Only extract what needs different characteristics.

### The Pattern

All these companies:
- Started with monoliths
- Grew to billions in revenue with monoliths
- Only changed architecture when forced by real constraints
- Moved to SOA or modular monoliths, not true microservices
- Took years to migrate when they did

## The Bottom Line

Microservices solve real problems. But they create real problems too.

Most teams need a monolith. A well-structured, modular monolith. Not microservices.

Start simple. Extract when you feel real pain. Not before.

Because here's the truth: it's easier to break apart a monolith than to merge microservices. I've done both. Trust me on this one.

Remember: boring technology choices let you focus on interesting business problems. Microservices are rarely the boring choice.

Need help deciding between monolith and microservices? Let's look at your actual constraints, not theoretical benefits.