---
title: "DDD: When Domain-Driven Design Becomes Your Personal Hell"
description: "Everyone loves DDD until they're drowning in repositories, value objects, and aggregate roots. Here's why tactical DDD often becomes expensive over-engineering."
publishDate: 2023-07-11
tags: ["architecture", "ddd", "over-engineering", "design-patterns"]
draft: false
---

Domain-Driven Design sounds perfect. Until you implement it.

Then you're six months in, drowning in abstractions, and your simple CRUD app has more layers than an onion. Your team hates you. You hate yourself.

Let me tell you why DDD can become your personal hell. And when it's actually worth it.

## The Two Levels Nobody Explains Properly

DDD has two parts. Most people mix them up.

**Strategic DDD**: The good stuff. Bounded contexts. Ubiquitous language. Context maps. This is about understanding your business domain.

**Tactical DDD**: The patterns. Entities, value objects, aggregates, repositories, domain services. This is where things go wrong.

Strategic DDD? Almost always valuable.
Tactical DDD? Usually over-engineering.

## Strategic DDD: The Part That Actually Helps

Bounded contexts are brilliant. Simple idea: different parts of your system have different models.

"User" means something different in:

- Authentication context (username, password)
- Billing context (payment methods, invoices)
- Support context (tickets, satisfaction scores)

The key insight is not forcing one model everywhere.

Ubiquitous language is also great because everyone uses the same terms - developers, product, and business people all speak the same language with no translation needed.

This stuff works. It's not complicated. You can apply it tomorrow.

## Tactical DDD: Where Dreams Go to Die

Now the painful part.

### The Repository Pattern Hell

Started with one repository. Now you have:

- UserRepository
- Its interface UserRepositoryInterface
- The implementation UserRepositoryImpl
- InMemoryUserRepository for your tests
- Don't forget CachedUserRepository
- And of course, UserRepositoryFactory

To save a user? Seven files to modify.

### Value Objects for Everything

Phone number? Value object.
Email? Value object.
User status? Value object.

> I'll use Go for examples, but read it as pseudocode. The pain is universal.

Your User entity:

```go
type User struct {
    id        UserId
    email     EmailValueObject
    phone     PhoneValueObject
    status    UserStatusValueObject
    createdAt DateTimeValueObject
}

func NewUser(
    id UserId,
    email EmailValueObject,
    phone PhoneValueObject,
    status UserStatusValueObject,
    createdAt DateTimeValueObject,
) (*User, error) {
    // validation logic here
    return &User{id, email, phone, status, createdAt}, nil
}
```

Congratulations. You've turned a database row into a philosophy degree.

### The Aggregate Root Nightmare

"Only access entities through aggregate roots!"

Now you load the entire Customer aggregate to check an email. Including their orders. Their addresses. Their payment methods.

Need to update a phone number? Load everything. Modify through the aggregate. Save everything.

Your database weeps.

### Domain Events Everywhere

User registered? Domain event.
When email changes, that's another event.
User logs in? You guessed it - domain event.

Now you have:

- EventBus to route them
- EventDispatcher to send them
- An EventStore to persist everything
- EventHandlers and EventListeners
- Don't forget EventProjections

Your 10-user app has enterprise-grade event sourcing. Why?

## The Real Cost of Tactical DDD

**Onboarding Hell**: New developer needs three weeks to understand your "domain model." Could have been productive in three days.

**Simple Changes Become Complex**: Adding a field? Update the entity, value object, repository, mapper, DTO, and five other layers.

**Performance Dies**: Loading full aggregates for simple queries. N+1 problems everywhere. ORMs can't optimize your "pure domain model."

**Testing Nightmare**: Mocking repositories, services, factories. Unit tests that test nothing. Integration tests that take forever.

## When Tactical DDD Makes Sense

It's not always bad - sometimes tactical DDD is exactly the right choice.

**Complex Business Logic**: Trading systems. Insurance calculations. Medical diagnosis. When the logic is the product.

**Regulatory Requirements**: Audit trails. Compliance. When you need to prove why decisions were made.

**Long-Term Investment**: Building for 10+ years. The upfront cost pays off.

Note what's NOT on this list: "large teams." Large teams need simplicity, not more abstractions. They need clear boundaries (strategic DDD), not repository patterns.

## The Pragmatic Approach

Here's what actually works:

### Use Strategic DDD Always

- Identify bounded contexts
- Build ubiquitous language
- Keep contexts separate
- Clear interfaces between contexts

### Use Tactical DDD Selectively

Start simple:

```go
type UserService struct {
    db *sql.DB
}

func (s *UserService) CreateUser(ctx context.Context, email, name string) error {
    // validation
    if !isValidEmail(email) {
        return errors.New("invalid email")
    }
    // business logic
    // save to database
    _, err := s.db.ExecContext(ctx,
        "INSERT INTO users (email, name) VALUES ($1, $2)",
        email, name,
    )
    return err
}
```

Extract patterns when pain appears:

- Repeated validation? Extract value object
- Complex state changes? Add domain events
- Invariants to protect? Create aggregate

But not before.

### The 80/20 Rule

Since 80% of your app is CRUD, you should treat it like CRUD.

20% is your core domain. That's where you might need DDD patterns.

Don't apply enterprise patterns to your user preferences screen.

## My DDD Simplification Rules

1. **Start with services and plain objects**
2. **Add repositories when you have multiple data sources**
3. **Add value objects when validation repeats**
4. **Add aggregates when invariants need protection**
5. **Add domain events when decoupling is necessary**
6. **Never add patterns preemptively**

## The Reality Check

Most systems don't need tactical DDD.

They need:

- Clear module boundaries (strategic DDD)
- Consistent naming (ubiquitous language)
- Simple, testable code
- Fast development cycles

Your e-commerce site? Unless you're Amazon, CRUD with good structure beats DDD.
Your SaaS app? Service layer with validation works fine.
Your startup? Ship features, not abstractions.

## The Bottom Line

Remember that DDD is a tool, not a religion.

Strategic DDD is free value, so definitely use it.

But with tactical DDD, you need to be very careful.

Start simple. Add complexity when pain justifies it. Not because a book said so.

Because here's the truth: customers don't care about your beautiful domain model. They care about features that work.

And you can't ship features when you're drowning in repositories and value objects.

Wrestling with DDD complexity? I help teams find the right balance between patterns and pragmatism.
