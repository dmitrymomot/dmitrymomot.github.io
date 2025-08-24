---
title: "React Performance Optimization: From Basics to Advanced"
description: "Comprehensive guide to making your React applications blazing fast"
publishDate: 2025-08-05
tags: ["react", "javascript", "performance", "frontend", "optimization"]
draft: false
---

React is fast by default, but as applications grow, performance can degrade. Let's explore optimization techniques from basic to advanced.

## Performance Metrics That Matter

```
Core Web Vitals Target:
┌────────────────────────────────────┐
│ LCP (Largest Contentful Paint)     │
│ ████████░░ < 2.5s (Good)          │
│                                    │
│ FID (First Input Delay)            │
│ ██████████ < 100ms (Good)          │
│                                    │
│ CLS (Cumulative Layout Shift)      │
│ █████████░ < 0.1 (Good)           │
└────────────────────────────────────┘
```

## React DevTools Profiler Analysis

![React Profiler Flame Graph](https://example.com/profiler-flame-graph.png)

### Understanding Render Patterns

```jsx
// Component render tracking
function ExpensiveComponent({ data }) {
    console.log("ExpensiveComponent rendered");

    // Track renders in development
    const renderCount = useRef(0);
    renderCount.current++;

    if (process.env.NODE_ENV === "development") {
        console.log(`Render #${renderCount.current}`);
    }

    return <ComplexVisualization data={data} />;
}
```

## Memoization Strategies

### React.memo with Custom Comparison

```jsx
const TodoItem = React.memo(
    ({ todo, onToggle, onDelete }) => {
        console.log(`Rendering TodoItem ${todo.id}`);

        return (
            <div className="todo-item">
                <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo.id)} />
                <span className={todo.completed ? "completed" : ""}>{todo.text}</span>
                <button onClick={() => onDelete(todo.id)}>Delete</button>
            </div>
        );
    },
    (prevProps, nextProps) => {
        // Custom comparison function
        return (
            prevProps.todo.id === nextProps.todo.id &&
            prevProps.todo.completed === nextProps.todo.completed &&
            prevProps.todo.text === nextProps.todo.text
        );
    },
);
```

### useMemo for Expensive Computations

```jsx
function DataGrid({ items, filters, sortConfig }) {
    // Expensive filtering and sorting
    const processedData = useMemo(() => {
        console.time("Data processing");

        let result = [...items];

        // Apply filters
        if (filters.length > 0) {
            result = result.filter((item) => filters.every((filter) => filter.test(item)));
        }

        // Apply sorting
        if (sortConfig) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                return sortConfig.direction === "asc" ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
            });
        }

        console.timeEnd("Data processing");
        return result;
    }, [items, filters, sortConfig]);

    return <VirtualizedList data={processedData} />;
}
```

## Code Splitting and Lazy Loading

```jsx
import { lazy, Suspense } from "react";

// Route-based code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));

// Component-based splitting with retry logic
const HeavyComponent = lazy(() =>
    import("./components/HeavyComponent").catch(() => {
        // Retry once after failure
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(import("./components/HeavyComponent"));
            }, 1000);
        });
    }),
);

function App() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </Suspense>
    );
}
```

## Virtual Scrolling Implementation

```jsx
import { FixedSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

function VirtualizedTable({ data }) {
    const Row = ({ index, style }) => (
        <div style={style} className="table-row">
            <span>{data[index].id}</span>
            <span>{data[index].name}</span>
            <span>{data[index].value}</span>
        </div>
    );

    return (
        <AutoSizer>
            {({ height, width }) => (
                <FixedSizeList height={height} itemCount={data.length} itemSize={50} width={width} overscanCount={5}>
                    {Row}
                </FixedSizeList>
            )}
        </AutoSizer>
    );
}
```

## State Management Optimization

### Context Splitting

```jsx
// Bad: Single large context
const AppContext = React.createContext();

// Good: Split contexts by update frequency
const UserContext = React.createContext();
const ThemeContext = React.createContext();
const NotificationContext = React.createContext();

// Optimized Provider Pattern
function OptimizedProvider({ children }) {
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState("light");

    // Memoize context values
    const userValue = useMemo(() => ({ user, setUser }), [user]);

    const themeValue = useMemo(() => ({ theme, setTheme }), [theme]);

    return (
        <UserContext.Provider value={userValue}>
            <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>
        </UserContext.Provider>
    );
}
```

## Bundle Size Analysis

```
Bundle Analysis:
┌─────────────────────────────────────┐
│ Main Bundle: 245KB (gzipped)       │
├─────────────────────────────────────┤
│ ■■■■■■■■■■ React: 42KB (17%)      │
│ ■■■■■■■■   Lodash: 35KB (14%)     │
│ ■■■■■■     Charts: 28KB (11%)     │
│ ■■■■■      UI Lib: 25KB (10%)     │
│ ■■■■       Forms: 20KB (8%)       │
│ ■■■        Icons: 15KB (6%)       │
│ ■■■■■■■■■■ Other: 80KB (34%)      │
└─────────────────────────────────────┘
```

### Webpack Bundle Optimization

```javascript
// webpack.config.js
module.exports = {
    optimization: {
        splitChunks: {
            chunks: "all",
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendors",
                    priority: 10,
                    reuseExistingChunk: true,
                },
                common: {
                    minChunks: 2,
                    priority: 5,
                    reuseExistingChunk: true,
                },
            },
        },
        usedExports: true,
        sideEffects: false,
    },
};
```

## Performance Monitoring Hooks

```jsx
// Custom performance monitoring hook
function usePerformanceMonitor(componentName) {
    const renderStart = useRef(performance.now());
    const renderCount = useRef(0);

    useEffect(() => {
        renderCount.current++;
        const renderTime = performance.now() - renderStart.current;

        // Log slow renders
        if (renderTime > 16) {
            // Slower than 60fps
            console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }

        // Send metrics to analytics
        if (window.analytics) {
            window.analytics.track("Component Render", {
                component: componentName,
                renderTime,
                renderCount: renderCount.current,
            });
        }

        renderStart.current = performance.now();
    });
}
```

## Image Optimization

```jsx
function OptimizedImage({ src, alt, priority = false }) {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        if (priority) {
            setIsIntersecting(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsIntersecting(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "50px" },
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [priority]);

    return (
        <div ref={imgRef}>
            {isIntersecting ? (
                <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" />
            ) : (
                <div className="image-placeholder" />
            )}
        </div>
    );
}
```

## Performance Comparison Table

| Technique           | Impact    | Difficulty | Use Case             |
| ------------------- | --------- | ---------- | -------------------- |
| React.memo          | High      | Low        | Pure components      |
| useMemo/useCallback | Medium    | Low        | Expensive operations |
| Code Splitting      | High      | Medium     | Large applications   |
| Virtual Scrolling   | Very High | Medium     | Long lists           |
| Web Workers         | High      | High       | CPU-intensive tasks  |
| Service Workers     | Medium    | High       | Offline support      |
| Bundle Optimization | High      | Medium     | All applications     |

## Common Performance Pitfalls

### Anti-Pattern Examples

```jsx
// ❌ Bad: Creating new objects in render
function BadComponent() {
    return (
        <ChildComponent
            style={{ margin: 10 }} // New object every render!
            onClick={() => console.log("clicked")} // New function!
        />
    );
}

// ✅ Good: Stable references
const styles = { margin: 10 };

function GoodComponent() {
    const handleClick = useCallback(() => {
        console.log("clicked");
    }, []);

    return <ChildComponent style={styles} onClick={handleClick} />;
}
```

## Performance Budget

```javascript
// performance-budget.js
module.exports = {
    bundles: [
        {
            name: "main",
            maxSize: "250kb",
        },
        {
            name: "vendor",
            maxSize: "150kb",
        },
    ],
    metrics: {
        lcp: 2500, // 2.5 seconds
        fid: 100, // 100ms
        cls: 0.1, // 0.1 score
        tti: 3500, // 3.5 seconds
    },
};
```

## Conclusion

Performance optimization is an iterative process. Start with measurements, identify bottlenecks, apply optimizations, and measure again. Remember: premature optimization is the root of all evil, but deliberate optimization based on real metrics is essential for great user experience.
