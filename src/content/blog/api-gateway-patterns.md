---
title: "API Gateway Patterns: Beyond Simple Proxying"
description: "Advanced patterns and techniques for building robust API gateways"
publishDate: 2025-07-30
tags: ["api", "microservices", "architecture", "backend"]
draft: false
---

API Gateways are more than just reverse proxies. They're the front door to your microservices, handling cross-cutting concerns elegantly.

## Gateway Architecture Overview

```
┌─────────────────────────────────────────────┐
│              API Gateway Layer              │
├─────────────────────────────────────────────┤
│   Rate Limiting │ Auth │ Cache │ Transform  │
├─────────────────────────────────────────────┤
│            Load Balancer / Router           │
└─────────────┬───────────┬──────────┬────────┘
              ▼           ▼          ▼
         Service A   Service B   Service C
```

## Request/Response Transformation

Transform requests and responses without changing backend services:

```javascript
// API Gateway transformation middleware
class TransformationMiddleware {
    async transformRequest(req) {
        // Version translation
        if (req.headers["api-version"] === "v1") {
            req.body = this.translateV1ToV2(req.body);
        }

        // Add correlation ID
        req.headers["x-correlation-id"] = uuid.v4();

        // Inject auth context
        req.headers["x-user-context"] = JSON.stringify({
            userId: req.user.id,
            permissions: req.user.permissions,
            tenant: req.user.tenantId,
        });

        return req;
    }

    async transformResponse(res) {
        // Remove internal headers
        delete res.headers["x-internal-trace"];

        // Add standard headers
        res.headers["x-api-version"] = "v2";
        res.headers["x-response-time"] = Date.now() - res.startTime;

        // Transform response format
        if (res.headers["accept"] === "application/xml") {
            res.body = this.jsonToXml(res.body);
            res.headers["content-type"] = "application/xml";
        }

        return res;
    }
}
```

## Circuit Breaker Implementation

Protect your services from cascading failures:

```python
from enum import Enum
from datetime import datetime, timedelta
import asyncio

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    def __init__(self,
                 failure_threshold=5,
                 recovery_timeout=60,
                 expected_exception=Exception):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED

    async def call(self, func, *args, **kwargs):
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
            else:
                raise Exception("Circuit breaker is OPEN")

        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except self.expected_exception as e:
            self._on_failure()
            raise e

    def _should_attempt_reset(self):
        return (
            self.last_failure_time and
            datetime.now() >= self.last_failure_time +
            timedelta(seconds=self.recovery_timeout)
        )

    def _on_success(self):
        self.failure_count = 0
        self.state = CircuitState.CLOSED

    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
```

## Load Balancing Strategies

| Strategy            | Description                             | Use Case                     | Pros                  | Cons                         |
| ------------------- | --------------------------------------- | ---------------------------- | --------------------- | ---------------------------- |
| Round Robin         | Requests distributed evenly             | Homogeneous services         | Simple, fair          | Ignores server load          |
| Least Connections   | Route to server with fewest connections | Long-lived connections       | Considers active load | Connection tracking overhead |
| Weighted            | Servers have different capacities       | Heterogeneous infrastructure | Flexible capacity     | Manual weight management     |
| IP Hash             | Same client always hits same server     | Session affinity needed      | Stateful services     | Uneven distribution          |
| Least Response Time | Fastest server gets request             | Performance critical         | Optimal response time | Complex tracking             |

## Authentication & Authorization

Multi-strategy authentication support:

```go
type AuthStrategy interface {
    Authenticate(req *http.Request) (*User, error)
    GetPriority() int
}

type JWTAuth struct {
    secretKey []byte
}

func (j *JWTAuth) Authenticate(req *http.Request) (*User, error) {
    token := extractToken(req.Header.Get("Authorization"))
    if token == "" {
        return nil, ErrNoToken
    }

    claims, err := validateJWT(token, j.secretKey)
    if err != nil {
        return nil, err
    }

    return &User{
        ID:          claims["sub"].(string),
        Permissions: claims["permissions"].([]string),
    }, nil
}

type APIKeyAuth struct {
    store KeyStore
}

func (a *APIKeyAuth) Authenticate(req *http.Request) (*User, error) {
    apiKey := req.Header.Get("X-API-Key")
    if apiKey == "" {
        return nil, ErrNoAPIKey
    }

    user, err := a.store.GetUserByKey(apiKey)
    if err != nil {
        return nil, err
    }

    return user, nil
}

type AuthMiddleware struct {
    strategies []AuthStrategy
}

func (m *AuthMiddleware) Handle(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        var lastErr error

        for _, strategy := range m.strategies {
            user, err := strategy.Authenticate(r)
            if err == nil {
                ctx := context.WithValue(r.Context(), "user", user)
                next.ServeHTTP(w, r.WithContext(ctx))
                return
            }
            lastErr = err
        }

        http.Error(w, lastErr.Error(), http.StatusUnauthorized)
    })
}
```

## Response Caching Strategy

```yaml
# Cache configuration
cache:
    default_ttl: 300
    max_size: 1GB
    eviction_policy: LRU

    rules:
        - path: /api/products/*
          method: GET
          ttl: 3600
          vary_by:
              - Accept
              - Accept-Language
          invalidate_on:
              - POST /api/products
              - PUT /api/products/*
              - DELETE /api/products/*

        - path: /api/user/profile
          method: GET
          ttl: 60
          vary_by:
              - Authorization
          private: true

        - path: /api/search
          method: GET
          ttl: 300
          vary_by:
              - query_params
```

## Service Discovery Integration

```javascript
class ServiceRegistry {
    constructor(consul) {
        this.consul = consul;
        this.services = new Map();
        this.healthChecks = new Map();
    }

    async discoverService(serviceName) {
        const cached = this.services.get(serviceName);
        if (cached && cached.expires > Date.now()) {
            return cached.instances;
        }

        const health = await this.consul.health.service({
            service: serviceName,
            passing: true,
        });

        const instances = health.map((entry) => ({
            id: entry.Service.ID,
            address: entry.Service.Address,
            port: entry.Service.Port,
            metadata: entry.Service.Meta,
            weight: parseInt(entry.Service.Meta?.weight || "1"),
        }));

        this.services.set(serviceName, {
            instances,
            expires: Date.now() + 30000, // 30 seconds cache
        });

        return instances;
    }

    async routeRequest(serviceName, request) {
        const instances = await this.discoverService(serviceName);

        if (instances.length === 0) {
            throw new Error(`No healthy instances for ${serviceName}`);
        }

        // Weighted random selection
        const instance = this.selectInstance(instances);

        return fetch(`http://${instance.address}:${instance.port}${request.path}`, {
            method: request.method,
            headers: request.headers,
            body: request.body,
        });
    }
}
```

## Request Aggregation Pattern

Combine multiple service calls into one:

```typescript
interface AggregationConfig {
    parallel: boolean;
    timeout: number;
    fallback?: any;
}

class RequestAggregator {
    async aggregate(requests: Map<string, Promise<any>>, config: AggregationConfig): Promise<any> {
        const result: any = {};

        if (config.parallel) {
            // Parallel execution with timeout
            const promises = Array.from(requests.entries()).map(async ([key, promise]) => {
                try {
                    const value = await Promise.race([promise, this.timeout(config.timeout)]);
                    result[key] = value;
                } catch (error) {
                    result[key] = config.fallback || { error: error.message };
                }
            });

            await Promise.all(promises);
        } else {
            // Sequential execution
            for (const [key, promise] of requests) {
                try {
                    result[key] = await promise;
                } catch (error) {
                    result[key] = config.fallback || { error: error.message };
                }
            }
        }

        return result;
    }

    private timeout(ms: number): Promise<never> {
        return new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));
    }
}

// Usage
app.get("/api/dashboard", async (req, res) => {
    const aggregator = new RequestAggregator();

    const requests = new Map([
        ["user", fetchUserProfile(req.userId)],
        ["stats", fetchUserStats(req.userId)],
        ["notifications", fetchNotifications(req.userId)],
        ["recommendations", fetchRecommendations(req.userId)],
    ]);

    const data = await aggregator.aggregate(requests, {
        parallel: true,
        timeout: 3000,
        fallback: {},
    });

    res.json(data);
});
```

## Performance Metrics

```
API Gateway Performance Dashboard:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Request Rate: 10,234 req/s
├─ Service A: 4,521 req/s
├─ Service B: 3,892 req/s
└─ Service C: 1,821 req/s

Latency (p50/p95/p99):
├─ Gateway: 2ms / 8ms / 15ms
├─ Service A: 45ms / 120ms / 250ms
├─ Service B: 30ms / 85ms / 180ms
└─ Service C: 60ms / 150ms / 300ms

Cache Hit Rate: 68%
Circuit Breaker Status:
├─ Service A: CLOSED ✅
├─ Service B: CLOSED ✅
└─ Service C: HALF_OPEN ⚠️

Error Rate: 0.02%
Active Connections: 5,432
```

## Gateway Configuration Best Practices

```nginx
# nginx.conf for API Gateway
upstream backend {
    least_conn;
    server backend1.example.com:8080 weight=3;
    server backend2.example.com:8080 weight=2;
    server backend3.example.com:8080 weight=1;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Caching
    proxy_cache_path /var/cache/nginx levels=1:2
                     keys_zone=api_cache:10m
                     max_size=1g inactive=60m;

    location /api/ {
        # Authentication
        auth_request /auth;

        # Proxy settings
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;

        # Cache
        proxy_cache api_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_use_stale error timeout;
    }
}
```

The API Gateway is the critical component that ties your microservices together. Design it carefully, monitor it closely, and evolve it continuously.
