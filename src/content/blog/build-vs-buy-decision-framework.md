---
title: "Build vs Buy: A Decision Framework"
description: "Stop debating build vs buy for weeks. Use this framework to make the decision in hours, considering real costs beyond just licensing fees."
publishDate: 2023-03-14
tags: ["strategy", "architecture", "decision-making", "consulting"]
draft: false
---

Every week, I see teams stuck in the same debate.

Should we build it ourselves or buy it?

The discussion drags on. Engineers want to build. Finance wants to buy. Nobody has a framework for deciding. So the debate becomes political, not practical.

Here's the framework I use. It cuts through the noise.

## The Real Cost Equation

Stop comparing development cost to license fees - that's amateur hour thinking.

The real equation:

- **Build Total Cost** = Development + Maintenance + Opportunity + Risk
- **Buy Total Cost** = License + Integration + Vendor Risk + Lock-in

Most teams only look at the first item in each list. That's why they make bad decisions.

## The Decision Framework

### Build When:

**It's your core differentiator.** If this is what makes you special, don't outsource it. Netflix builds its streaming tech. They buy their HR system.

**You need full control.** Some things can't have external dependencies. Payment processing for a payment company? Build it. CRM for the same company? Buy it.

**The market solutions don't fit.** Not "don't fit perfectly." Don't fit at all. If you need 20% customization, buy and customize. If you need 80% customization, build.

**You have the expertise.** And I mean really have it. Not "we can learn." Already have it.

### Buy When:

**It's a solved problem.** Authentication? Solved. Email delivery? Solved. Don't rebuild solved problems unless that's your business.

**Time to market matters more.** Three months to build or one week to integrate? If speed matters, buy.

**Maintenance would kill you.** That cool custom analytics system? Who's maintaining it in three years when the original developer left?

**You're small.** Harsh truth: small teams should buy almost everything that's not core. You don't have the luxury of building.

## The Hidden Costs Nobody Talks About

### Hidden Build Costs:

- Your best developers stuck maintaining instead of innovating
- You now own security updates forever
- Compliance becomes your problem
- Documentation nobody will write
- When developers leave, the knowledge goes with them

### Hidden Buy Costs:

- Integration complexity that vendors downplay
- Price increases after you're locked in
- Features you need that "are on the roadmap"
- Support that's worse than promised
- Data migration when you want to leave

## My Quick Assessment Method

Answer these five questions:

1. **Is this your competitive advantage?** (Yes = lean build)
2. **Can you maintain it for 5 years?** (No = lean buy)
3. **Do you have expertise in-house today?** (No = lean buy)
4. **Will you need it in 6 months?** (Yes = lean buy)
5. **Is there a mature solution available?** (Yes = lean buy)

Three or more "lean buy" answers? Buy it.

## The Hybrid Approach

Here's what works in practice:

Buy the platform. Build the differentiator.

Use Stripe for payments, but build your unique billing logic on top.
Auth0 handles authentication while you focus on your permission system.
SendGrid delivers emails. Your notification logic makes them smart.

This gives you speed without sacrificing what makes you unique.

## The Vendor Evaluation Matrix

If you decide to buy, evaluate vendors on:

**Must-haves:**

- API quality and documentation
- Data export capabilities
- Pricing transparency
- Uptime history

**Nice-to-haves:**

- Open source alternatives exist
- Multiple integration options
- Strong community
- Reasonable support SLAs

**Red flags:**

- No public pricing
- No data export
- Requires professional services to implement
- Bad reviews from similar-sized companies

## Make the Decision and Move On

The worst decision? Not deciding.

I've seen teams debate build vs buy for three months. They could have built it twice in that time. Or integrated five solutions.

Use the framework to make the decision in a day rather than a month, then execute.

Perfect decisions don't exist. But fast, good-enough decisions beat slow, perfect ones every time.

Remember: you can always change your mind later. But you can't get back the time you waste debating.

Got a build vs buy decision that's been dragging on? I can help you cut through the noise.
