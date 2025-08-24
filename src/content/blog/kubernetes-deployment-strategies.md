---
title: "Kubernetes Deployment Strategies: Zero-Downtime Updates"
description: "Master different deployment strategies in Kubernetes for reliable application updates"
publishDate: 2025-08-10
tags: ["kubernetes", "devops", "deployment", "cloud native", "containers"]
draft: false
---

Deploying applications without downtime is crucial for modern services. Let's explore various Kubernetes deployment strategies to achieve seamless updates.

## Deployment Strategy Overview

![Deployment Strategies Comparison](https://example.com/k8s-deployment-strategies.png)

### Strategy Comparison Matrix

| Strategy       | Downtime | Rollback Speed | Resource Cost | Testing in Prod | Complexity |
| -------------- | -------- | -------------- | ------------- | --------------- | ---------- |
| Recreate       | Yes      | Fast           | Low           | No              | Low        |
| Rolling Update | No       | Medium         | Low           | Limited         | Low        |
| Blue-Green     | No       | Instant        | High          | Yes             | Medium     |
| Canary         | No       | Fast           | Medium        | Yes             | Medium     |
| A/B Testing    | No       | Fast           | Medium        | Yes             | High       |
| Shadow         | No       | N/A            | High          | Yes             | High       |

## Rolling Update Strategy

The default Kubernetes deployment strategy:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
    name: app-deployment
spec:
    replicas: 10
    strategy:
        type: RollingUpdate
        rollingUpdate:
            maxSurge: 2 # Maximum pods above desired replicas
            maxUnavailable: 1 # Maximum pods that can be unavailable
    selector:
        matchLabels:
            app: myapp
    template:
        metadata:
            labels:
                app: myapp
                version: v2.0.0
        spec:
            containers:
                - name: app
                  image: myapp:v2.0.0
                  ports:
                      - containerPort: 8080
                  readinessProbe:
                      httpGet:
                          path: /health
                          port: 8080
                      initialDelaySeconds: 10
                      periodSeconds: 5
                  livenessProbe:
                      httpGet:
                          path: /health
                          port: 8080
                      initialDelaySeconds: 30
                      periodSeconds: 10
                  resources:
                      requests:
                          memory: "256Mi"
                          cpu: "250m"
                      limits:
                          memory: "512Mi"
                          cpu: "500m"
```

## Blue-Green Deployment

Full environment swap with instant rollback:

```yaml
# Blue Deployment (Current)
apiVersion: apps/v1
kind: Deployment
metadata:
    name: app-blue
spec:
    replicas: 5
    selector:
        matchLabels:
            app: myapp
            version: blue
    template:
        metadata:
            labels:
                app: myapp
                version: blue
        spec:
            containers:
                - name: app
                  image: myapp:v1.0.0
                  ports:
                      - containerPort: 8080

---
# Green Deployment (New)
apiVersion: apps/v1
kind: Deployment
metadata:
    name: app-green
spec:
    replicas: 5
    selector:
        matchLabels:
            app: myapp
            version: green
    template:
        metadata:
            labels:
                app: myapp
                version: green
        spec:
            containers:
                - name: app
                  image: myapp:v2.0.0
                  ports:
                      - containerPort: 8080

---
# Service (Switch between blue/green)
apiVersion: v1
kind: Service
metadata:
    name: app-service
spec:
    selector:
        app: myapp
        version: blue # Change to 'green' to switch
    ports:
        - port: 80
          targetPort: 8080
```

### Blue-Green Switch Script

```bash
#!/bin/bash
# blue-green-switch.sh

NAMESPACE="production"
SERVICE="app-service"
NEW_VERSION=$1

if [ "$NEW_VERSION" != "blue" ] && [ "$NEW_VERSION" != "green" ]; then
    echo "Usage: $0 [blue|green]"
    exit 1
fi

echo "Switching to $NEW_VERSION deployment..."

# Update service selector
kubectl patch service $SERVICE -n $NAMESPACE -p \
  '{"spec":{"selector":{"version":"'$NEW_VERSION'"}}}'

# Wait for endpoints to be ready
kubectl wait --for=condition=ready pod \
  -l version=$NEW_VERSION -n $NAMESPACE --timeout=60s

# Verify the switch
echo "Current active version:"
kubectl get service $SERVICE -n $NAMESPACE \
  -o jsonpath='{.spec.selector.version}'
```

## Canary Deployment with Flagger

Progressive delivery using Flagger:

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
    name: app-canary
spec:
    targetRef:
        apiVersion: apps/v1
        kind: Deployment
        name: app
    service:
        port: 80
        targetPort: 8080
        gateways:
            - public-gateway.istio-system.svc.cluster.local
        hosts:
            - app.example.com
    analysis:
        interval: 1m
        threshold: 10
        maxWeight: 50
        stepWeight: 5
        metrics:
            - name: request-success-rate
              thresholdRange:
                  min: 99
              interval: 1m
            - name: request-duration
              thresholdRange:
                  max: 500
              interval: 1m
        webhooks:
            - name: load-test
              url: http://loadtester/
              timeout: 5s
              metadata:
                  cmd: "hey -z 1m -q 10 -c 2 http://app-canary.test:80/"
```

## A/B Testing with Istio

Traffic splitting based on headers:

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
    name: app-ab-testing
spec:
    hosts:
        - app.example.com
    http:
        - match:
              - headers:
                    x-user-group:
                        exact: beta
          route:
              - destination:
                    host: app
                    subset: v2
                weight: 100
        - route:
              - destination:
                    host: app
                    subset: v1
                weight: 90
              - destination:
                    host: app
                    subset: v2
                weight: 10

---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
    name: app-destination
spec:
    host: app
    subsets:
        - name: v1
          labels:
              version: v1
        - name: v2
          labels:
              version: v2
```

## Shadow Deployment

Mirror traffic for testing:

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
    name: app-shadow
spec:
    hosts:
        - app.example.com
    http:
        - route:
              - destination:
                    host: app-stable
                weight: 100
          mirror:
              host: app-shadow
          mirrorPercentage:
              value: 100.0
```

## GitOps with ArgoCD

Automated deployment pipeline:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
    name: production-app
    namespace: argocd
spec:
    project: default
    source:
        repoURL: https://github.com/company/k8s-configs
        targetRevision: HEAD
        path: production
    destination:
        server: https://kubernetes.default.svc
        namespace: production
    syncPolicy:
        automated:
            prune: true
            selfHeal: true
            allowEmpty: false
        syncOptions:
            - CreateNamespace=true
        retry:
            limit: 5
            backoff:
                duration: 5s
                factor: 2
                maxDuration: 3m
```

## Health Checks and Readiness Gates

```yaml
apiVersion: v1
kind: Pod
metadata:
    name: app-pod
spec:
    readinessGates:
        - conditionType: "www.example.com/feature-1"
    containers:
        - name: app
          image: myapp:v2.0.0
          readinessProbe:
              httpGet:
                  path: /ready
                  port: 8080
              initialDelaySeconds: 10
              periodSeconds: 5
              successThreshold: 1
              failureThreshold: 3
          livenessProbe:
              httpGet:
                  path: /health
                  port: 8080
              initialDelaySeconds: 30
              periodSeconds: 10
              timeoutSeconds: 5
              failureThreshold: 3
          startupProbe:
              httpGet:
                  path: /startup
                  port: 8080
              initialDelaySeconds: 0
              periodSeconds: 10
              timeoutSeconds: 1
              failureThreshold: 30
```

## Rollback Strategies

### Automated Rollback Script

```bash
#!/bin/bash
# rollback.sh

DEPLOYMENT=$1
NAMESPACE=${2:-default}
REVISION=${3:-0}  # 0 means previous revision

echo "Rolling back $DEPLOYMENT in namespace $NAMESPACE..."

# Check current revision
CURRENT=$(kubectl rollout history deployment/$DEPLOYMENT -n $NAMESPACE \
  | tail -2 | head -1 | awk '{print $1}')

echo "Current revision: $CURRENT"

# Perform rollback
kubectl rollout undo deployment/$DEPLOYMENT \
  --to-revision=$REVISION -n $NAMESPACE

# Wait for rollback to complete
kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE

# Verify new revision
NEW=$(kubectl rollout history deployment/$DEPLOYMENT -n $NAMESPACE \
  | tail -2 | head -1 | awk '{print $1}')

echo "Rolled back to revision: $NEW"

# Check pod status
kubectl get pods -n $NAMESPACE -l app=$DEPLOYMENT
```

## Monitoring Deployment Progress

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
    name: grafana-dashboard
data:
    deployment-dashboard.json: |
        {
          "dashboard": {
            "title": "Kubernetes Deployments",
            "panels": [
              {
                "title": "Deployment Status",
                "targets": [
                  {
                    "expr": "kube_deployment_status_replicas{namespace=\"$namespace\"}"
                  }
                ]
              },
              {
                "title": "Pod Restart Rate",
                "targets": [
                  {
                    "expr": "rate(kube_pod_container_status_restarts_total[5m])"
                  }
                ]
              },
              {
                "title": "Request Success Rate",
                "targets": [
                  {
                    "expr": "sum(rate(http_requests_total{status=~\"2..\"}[5m])) / sum(rate(http_requests_total[5m]))"
                  }
                ]
              }
            ]
          }
        }
```

## Progressive Delivery Metrics

```
Deployment Progress Timeline:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Start    10%    25%    50%    75%    100%
  │       │      │      │      │       │
  ▼       ▼      ▼      ▼      ▼       ▼
[■■□□□][■■■□□][■■■■□][■■■■■][■■■■■][■■■■■]
 0min   5min   10min  15min  20min  25min

Success Rate: 99.95%
Error Rate: 0.05%
Rollback Triggered: No
```

## Best Practices Checklist

- [ ] **Always use health checks** (readiness, liveness, startup)
- [ ] **Set appropriate resource limits** to prevent cascade failures
- [ ] **Implement proper monitoring** before deployment
- [ ] **Use namespace separation** for different environments
- [ ] **Practice rollback procedures** regularly
- [ ] **Implement circuit breakers** in your application
- [ ] **Use PodDisruptionBudgets** to maintain availability
- [ ] **Test deployment strategies** in staging first
- [ ] **Document rollback procedures** clearly
- [ ] **Automate deployment pipelines** with GitOps

## Common Pitfalls

1. **Not setting PodDisruptionBudget**

    ```yaml
    apiVersion: policy/v1
    kind: PodDisruptionBudget
    metadata:
        name: app-pdb
    spec:
        minAvailable: 2
        selector:
            matchLabels:
                app: myapp
    ```

2. **Ignoring graceful shutdown**
3. **Missing resource quotas**
4. **Inadequate health check configuration**
5. **Not testing rollback procedures**

Choose your deployment strategy based on your risk tolerance, user impact acceptance, and infrastructure resources. Start simple with rolling updates and evolve to more sophisticated strategies as needed.
