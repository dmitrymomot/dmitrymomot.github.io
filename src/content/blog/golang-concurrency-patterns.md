---
title: "Go Concurrency Patterns: From Basics to Advanced"
description: "Master Go's concurrency primitives and patterns for building efficient concurrent systems"
publishDate: 2025-07-28
tags: ["golang", "concurrency", "programming", "performance"]
draft: false
---

Go's concurrency model, based on CSP (Communicating Sequential Processes), makes concurrent programming more accessible. Let's explore patterns from basic to advanced.

## Goroutines and Channels Fundamentals

```go
// Basic goroutine spawning
func main() {
    messages := make(chan string, 2)

    go func() {
        time.Sleep(time.Second)
        messages <- "Hello"
    }()

    go func() {
        time.Sleep(2 * time.Second)
        messages <- "World"
    }()

    // Receive both messages
    fmt.Println(<-messages)
    fmt.Println(<-messages)
}
```

## Worker Pool Pattern

Efficiently process tasks with a fixed number of workers:

```go
type Job struct {
    ID   int
    Data []byte
}

type Result struct {
    JobID int
    Output string
    Error error
}

type WorkerPool struct {
    workers   int
    jobs      chan Job
    results   chan Result
    done      chan struct{}
}

func NewWorkerPool(workers int) *WorkerPool {
    return &WorkerPool{
        workers: workers,
        jobs:    make(chan Job, workers*2),
        results: make(chan Result, workers*2),
        done:    make(chan struct{}),
    }
}

func (wp *WorkerPool) Start() {
    for i := 0; i < wp.workers; i++ {
        go wp.worker(i)
    }
}

func (wp *WorkerPool) worker(id int) {
    for {
        select {
        case job := <-wp.jobs:
            result := wp.process(job)
            wp.results <- result
        case <-wp.done:
            return
        }
    }
}

func (wp *WorkerPool) process(job Job) Result {
    // Simulate work
    time.Sleep(time.Millisecond * time.Duration(rand.Intn(100)))

    return Result{
        JobID:  job.ID,
        Output: fmt.Sprintf("Processed %d bytes", len(job.Data)),
        Error:  nil,
    }
}

func (wp *WorkerPool) Submit(job Job) {
    wp.jobs <- job
}

func (wp *WorkerPool) GetResult() Result {
    return <-wp.results
}

func (wp *WorkerPool) Stop() {
    close(wp.done)
}
```

## Fan-In/Fan-Out Pattern

Distribute work and collect results:

```go
// Fan-out: distribute work across multiple goroutines
func fanOut(in <-chan int, workers int) []<-chan int {
    channels := make([]<-chan int, workers)

    for i := 0; i < workers; i++ {
        ch := make(chan int)
        channels[i] = ch

        go func(output chan<- int) {
            for val := range in {
                // Process value
                output <- val * val
            }
            close(output)
        }(ch)
    }

    return channels
}

// Fan-in: merge multiple channels into one
func fanIn(channels ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup

    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for val := range c {
                out <- val
            }
        }(ch)
    }

    go func() {
        wg.Wait()
        close(out)
    }()

    return out
}
```

## Pipeline Pattern

Chain processing stages:

```go
// Pipeline stages
func generate(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}

func filter(in <-chan int, threshold int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            if n > threshold {
                out <- n
            }
        }
        close(out)
    }()
    return out
}

// Usage
func main() {
    numbers := generate(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    squared := square(numbers)
    filtered := filter(squared, 20)

    for result := range filtered {
        fmt.Println(result) // Outputs: 25, 36, 49, 64, 81, 100
    }
}
```

## Context for Cancellation

Proper cancellation propagation:

```go
type Service struct {
    name string
}

func (s *Service) DoWork(ctx context.Context) error {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("%s: Shutting down gracefully\n", s.name)
            return ctx.Err()
        default:
            // Simulate work
            fmt.Printf("%s: Working...\n", s.name)
            time.Sleep(time.Second)
        }
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    services := []*Service{
        {name: "API"},
        {name: "Database"},
        {name: "Cache"},
    }

    var wg sync.WaitGroup
    for _, service := range services {
        wg.Add(1)
        go func(s *Service) {
            defer wg.Done()
            if err := s.DoWork(ctx); err != nil {
                fmt.Printf("%s: %v\n", s.name, err)
            }
        }(service)
    }

    wg.Wait()
    fmt.Println("All services stopped")
}
```

## Rate Limiting Pattern

Control request rate:

```go
type RateLimiter struct {
    rate     int
    bucket   chan struct{}
    stop     chan struct{}
}

func NewRateLimiter(rate int) *RateLimiter {
    rl := &RateLimiter{
        rate:   rate,
        bucket: make(chan struct{}, rate),
        stop:   make(chan struct{}),
    }

    // Fill bucket initially
    for i := 0; i < rate; i++ {
        rl.bucket <- struct{}{}
    }

    // Refill bucket periodically
    go func() {
        ticker := time.NewTicker(time.Second / time.Duration(rate))
        defer ticker.Stop()

        for {
            select {
            case <-ticker.C:
                select {
                case rl.bucket <- struct{}{}:
                default:
                    // Bucket full, skip
                }
            case <-rl.stop:
                return
            }
        }
    }()

    return rl
}

func (rl *RateLimiter) Allow() bool {
    select {
    case <-rl.bucket:
        return true
    default:
        return false
    }
}

func (rl *RateLimiter) Wait() {
    <-rl.bucket
}
```

## Semaphore Pattern

Limit concurrent operations:

```go
type Semaphore struct {
    semaCh chan struct{}
}

func NewSemaphore(maxConcurrency int) *Semaphore {
    return &Semaphore{
        semaCh: make(chan struct{}, maxConcurrency),
    }
}

func (s *Semaphore) Acquire() {
    s.semaCh <- struct{}{}
}

func (s *Semaphore) Release() {
    <-s.semaCh
}

// Usage example
func downloadFiles(urls []string) {
    sem := NewSemaphore(3) // Max 3 concurrent downloads
    var wg sync.WaitGroup

    for _, url := range urls {
        wg.Add(1)
        go func(u string) {
            defer wg.Done()

            sem.Acquire()
            defer sem.Release()

            // Download file
            fmt.Printf("Downloading %s\n", u)
            time.Sleep(time.Second) // Simulate download
            fmt.Printf("Completed %s\n", u)
        }(url)
    }

    wg.Wait()
}
```

## Error Group Pattern

Handle errors in concurrent operations:

```go
import "golang.org/x/sync/errgroup"

func processItems(items []string) error {
    g, ctx := errgroup.WithContext(context.Background())

    for _, item := range items {
        item := item // Capture loop variable

        g.Go(func() error {
            select {
            case <-ctx.Done():
                return ctx.Err()
            default:
                return processItem(item)
            }
        })
    }

    // Wait for all goroutines and return first error
    if err := g.Wait(); err != nil {
        return fmt.Errorf("processing failed: %w", err)
    }

    return nil
}
```

## Pub/Sub Pattern

Event broadcasting:

```go
type PubSub struct {
    mu          sync.RWMutex
    subscribers map[string][]chan interface{}
}

func NewPubSub() *PubSub {
    return &PubSub{
        subscribers: make(map[string][]chan interface{}),
    }
}

func (ps *PubSub) Subscribe(topic string) <-chan interface{} {
    ps.mu.Lock()
    defer ps.mu.Unlock()

    ch := make(chan interface{}, 10)
    ps.subscribers[topic] = append(ps.subscribers[topic], ch)

    return ch
}

func (ps *PubSub) Publish(topic string, msg interface{}) {
    ps.mu.RLock()
    defer ps.mu.RUnlock()

    for _, ch := range ps.subscribers[topic] {
        select {
        case ch <- msg:
        default:
            // Channel full, skip
        }
    }
}

func (ps *PubSub) Unsubscribe(topic string, ch <-chan interface{}) {
    ps.mu.Lock()
    defer ps.mu.Unlock()

    subscribers := ps.subscribers[topic]
    for i, sub := range subscribers {
        if sub == ch {
            ps.subscribers[topic] = append(subscribers[:i], subscribers[i+1:]...)
            close(sub)
            break
        }
    }
}
```

## Performance Comparison

| Pattern        | Use Case            | Complexity | Performance |
| -------------- | ------------------- | ---------- | ----------- |
| Worker Pool    | Task processing     | Medium     | High        |
| Pipeline       | Data transformation | Low        | High        |
| Fan-In/Fan-Out | Parallel processing | Medium     | Very High   |
| Rate Limiter   | API throttling      | Low        | Medium      |
| Semaphore      | Resource limiting   | Low        | High        |
| Pub/Sub        | Event distribution  | Medium     | Medium      |

## Common Pitfalls and Solutions

```go
// ❌ Goroutine leak
func bad() {
    ch := make(chan int)
    go func() {
        val := <-ch // This will block forever
        fmt.Println(val)
    }()
    // Channel never closed or written to
}

// ✅ Proper cleanup
func good() {
    ch := make(chan int)
    done := make(chan struct{})

    go func() {
        select {
        case val := <-ch:
            fmt.Println(val)
        case <-done:
            return
        }
    }()

    // Clean shutdown
    close(done)
}

// ❌ Data race
type Counter struct {
    value int
}

func (c *Counter) BadIncrement() {
    c.value++ // Race condition!
}

// ✅ Thread-safe
type SafeCounter struct {
    mu    sync.Mutex
    value int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.value++
}
```

## Concurrency Visualization

```
Goroutine Timeline:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

G1: ████████░░░░████████░░░░░░░░
G2: ░░██████████░░░░░░████████░░
G3: ░░░░████████████░░░░░░██████
G4: ██░░░░░░████████████░░░░░░░░

Channel Operations:
Send:    ↓   ↓     ↓      ↓
Receive: ↑     ↑       ↑     ↑
Time: ───────────────────────────→
```

## Best Practices

1. **Don't communicate by sharing memory; share memory by communicating**
2. **Channels orchestrate; mutexes serialize**
3. **The bigger the interface, the weaker the abstraction**
4. **Make the zero value useful**
5. **Don't panic**

Go's concurrency primitives are powerful tools. Use them wisely to build robust, efficient concurrent systems.
