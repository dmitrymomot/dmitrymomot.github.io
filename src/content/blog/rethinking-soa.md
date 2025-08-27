---
title: "Rethinking SOA: Design Services Like SaaS Products"
description: "Forget the enterprise SOA from 2005. Modern SOA means designing each service as if it could be sold as a standalone SaaS product."
publishDate: 2023-06-27
tags: ["architecture", "soa", "microservices", "saas", "api-design"]
draft: false
---

In my [previous post](/blog/microservices-when-they-help-hurt), I wrote about microservices vs monoliths. But there's a third way nobody talks about anymore: SOA.

> Fair warning: This is my take on SOA. Not what you'll find in enterprise architecture books. Not the "official" definition. Just what works for me in practice.

When I say SOA, you probably think SOAP. XML. Enterprise service buses. The nightmare of 2005.

Forget all that.

I'm talking about something different. A simple rule that changes everything: **Design each service as if you could sell it as a SaaS product tomorrow.**

## The SaaS Test

Could you package your user service and sell it as Auth0?

What about your notification service - would anyone pay for it like SendGrid?

Could your file storage service stand against S3?

Probably not at their scale. But that's not the point.

The point is this forces you to think differently.

## What This Means in Practice

### Real Business Capabilities

A SaaS product solves a real problem. Not a technical problem. A business problem.

Bad service: "Database adapter service"
Good service: "Customer management service"

Nobody pays for database adapters. People pay for customer management.

### Complete Ownership

A SaaS product owns its data. Completely.

No reaching into other services' databases. No shared tables. No "it's complicated" data relationships.

Your payment service owns payment data. Period. Others want it? They call your API.

### Proper APIs With Real Contracts

Would you pay for a service with a crappy API? Neither would your teams.

This means:

- Versioned endpoints
- Clear documentation
- Predictable errors
- Rate limiting
- Authentication

But here's the critical part: **API stability is non-negotiable.**

Your team manages the API like it's for external paying clients. Breaking changes? Major version bump with migration period. Other teams shouldn't rewrite adapters every sprint.

If Stripe changed their API every week, you'd switch providers. Same rule applies internally.

Treat internal consumers like paying customers. Because they are paying - with their time and sanity.

### Independent Value

Each service must justify its existence.

Can't explain what value it provides? Can't identify who would "pay" for it? It shouldn't be a service.

This kills the tendency to create technical services that just shuffle data around.

## The Architecture That Emerges

When you apply the SaaS test, you get:

**5-10 solid services, not 50 microservices**

Each one substantial. Each one valuable. Each one with clear ownership.

**Business boundaries, not technical ones**

Services map to business capabilities. How the business thinks about the problem.

**True independence**

Each service could theoretically have different:

- Tech stack
- Database
- Deployment schedule
- Team
- Even pricing model (for internal chargeback)

## Real Examples

**User Service**: Authentication, authorization, user profiles, preferences. Everything about users in one service. Could be Okta.

**Billing Service**: Handles subscriptions, invoices, payments, dunning. Everything money-related. You could replace it with Stripe tomorrow.

**Communication Service**: Email, SMS, push notifications, in-app messages. All outbound communication. Basically your own Twilio.

**Analytics Service**: Collects events, tracks metrics, generates reports and dashboards. Think Mixpanel but internal.

Notice: Each could be replaced by an actual SaaS. That's the test.

## Why This Works Better

### Than Microservices

Fewer moving parts. Less operational overhead. Clear boundaries.

You're not debugging distributed transactions across 20 services at 2 AM.

### Than Monoliths

Real team independence. Different tech choices where they matter. Independent deployment.

Team A can deploy their billing service without Team B's notification service knowing or caring.

## The Migration Path

Start with your monolith. Identify one clear business capability that:

1. Has value on its own
2. Has clear boundaries
3. Changes at different pace
4. Could theoretically be a product

Extract it. Make it excellent. Make its API so good other teams prefer it to building their own.

Repeat only when the pain is real.

## The Mental Model Shift

Stop thinking "How do I split this code?"

Start thinking "What services would I pay for?"

This changes everything. You stop creating services for technical reasons. You start creating them for business reasons.

And that's when SOA actually works.

## The Reality Check

Most systems need 3-7 services. Not 30. Not 70.

Each service substantial enough to justify its complexity. Each service valuable enough that someone would pay for it.

That's modern SOA. Not your father's enterprise architecture.

Services designed like products. Because the best internal services are indistinguishable from good SaaS products.

Except you don't get a bill.

Thinking about restructuring your architecture? Let's discuss what services would actually make sense for your business.
