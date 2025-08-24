---
title: "Docker Security: Hardening Containers for Production"
description: "Essential security practices for running Docker containers in production environments"
publishDate: 2025-08-03
tags: ["docker", "security", "devops", "containers", "kubernetes"]
draft: false
---

Container security is not just about the container runtime. It's a comprehensive approach covering the entire lifecycle from development to production.

## Security Scanning Pipeline

```yaml
# .gitlab-ci.yml
stages:
    - build
    - scan
    - test
    - deploy

variables:
    IMAGE_NAME: ${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}

security_scan:
    stage: scan
    script:
        # Scan Dockerfile for best practices
        - hadolint Dockerfile

        # Scan for vulnerabilities
        - trivy image --severity HIGH,CRITICAL ${IMAGE_NAME}

        # Check for secrets
        - trufflehog --regex --entropy=False ${CI_PROJECT_DIR}

        # SAST scanning
        - semgrep --config=auto .
    artifacts:
        reports:
            container_scanning: trivy-report.json
            sast: semgrep-report.json
```

## Secure Dockerfile Practices

```dockerfile
# Multi-stage build for smaller attack surface
FROM node:18-alpine AS builder

# Create non-root user early
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy dependency files first (layer caching)
COPY package*.json ./

# Install dependencies as root (required for some packages)
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY --chown=nodejs:nodejs . .

# Final stage
FROM node:18-alpine

# Install security updates
RUN apk update && \
    apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy from builder stage
COPY --from=builder --chown=nodejs:nodejs /app .

# Set security options
USER nodejs

# Expose port (documentation only)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

## Runtime Security Configuration

### AppArmor Profile

```
#include <tunables/global>

profile docker-nginx flags=(attach_disconnected,mediate_deleted) {
  #include <abstractions/base>

  # Deny all file writes
  deny /** w,

  # Allow specific reads
  /usr/sbin/nginx r,
  /etc/nginx/** r,
  /usr/share/nginx/** r,
  /var/log/nginx/** w,
  /var/cache/nginx/** rw,
  /run/nginx.pid rw,

  # Network access
  network inet tcp,
  network inet6 tcp,

  # Capabilities
  capability setuid,
  capability setgid,
  capability net_bind_service,

  # Deny dangerous capabilities
  deny capability sys_admin,
  deny capability sys_module,
  deny capability sys_rawio,
}
```

### Seccomp Profile

```json
{
    "defaultAction": "SCMP_ACT_ERRNO",
    "architectures": ["SCMP_ARCH_X86_64", "SCMP_ARCH_X86", "SCMP_ARCH_X32"],
    "syscalls": [
        {
            "names": [
                "accept",
                "accept4",
                "access",
                "bind",
                "clone",
                "close",
                "connect",
                "dup",
                "dup2",
                "execve",
                "exit",
                "exit_group",
                "fstat",
                "futex",
                "getpid",
                "getuid",
                "listen",
                "mmap",
                "mprotect",
                "open",
                "read",
                "recvfrom",
                "sendto",
                "socket",
                "stat",
                "write"
            ],
            "action": "SCMP_ACT_ALLOW"
        }
    ]
}
```

## Container Hardening Checklist

| Security Measure               | Implementation                     | Status |
| ------------------------------ | ---------------------------------- | ------ |
| Run as non-root user           | `USER 1001` in Dockerfile          | ✅     |
| Read-only root filesystem      | `--read-only` flag                 | ✅     |
| No new privileges              | `--security-opt=no-new-privileges` | ✅     |
| Drop all capabilities          | `--cap-drop=ALL`                   | ✅     |
| Add only required capabilities | `--cap-add=NET_BIND_SERVICE`       | ✅     |
| Resource limits                | `--memory=512m --cpus=1`           | ✅     |
| Health checks                  | `HEALTHCHECK` instruction          | ✅     |
| Security scanning              | Trivy, Clair, Snyk                 | ✅     |
| Network segmentation           | Custom bridge networks             | ✅     |
| Secrets management             | Docker secrets, Vault              | ✅     |

## Kubernetes Security Context

```yaml
apiVersion: v1
kind: Pod
metadata:
    name: secure-pod
spec:
    securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
        seccompProfile:
            type: RuntimeDefault
    containers:
        - name: app
          image: myapp:latest
          securityContext:
              allowPrivilegeEscalation: false
              readOnlyRootFilesystem: true
              runAsNonRoot: true
              runAsUser: 1001
              capabilities:
                  drop:
                      - ALL
                  add:
                      - NET_BIND_SERVICE
          resources:
              limits:
                  memory: "512Mi"
                  cpu: "500m"
              requests:
                  memory: "256Mi"
                  cpu: "250m"
          volumeMounts:
              - name: tmp
                mountPath: /tmp
              - name: cache
                mountPath: /app/cache
    volumes:
        - name: tmp
          emptyDir: {}
        - name: cache
          emptyDir: {}
```

## Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
    name: app-network-policy
spec:
    podSelector:
        matchLabels:
            app: myapp
    policyTypes:
        - Ingress
        - Egress
    ingress:
        - from:
              - namespaceSelector:
                    matchLabels:
                        name: ingress-nginx
              - podSelector:
                    matchLabels:
                        app: frontend
          ports:
              - protocol: TCP
                port: 8080
    egress:
        - to:
              - namespaceSelector:
                    matchLabels:
                        name: database
          ports:
              - protocol: TCP
                port: 5432
        - to:
              - namespaceSelector:
                    matchLabels:
                        name: kube-system
                podSelector:
                    matchLabels:
                        k8s-app: kube-dns
          ports:
              - protocol: UDP
                port: 53
```

## Secret Management

```bash
#!/bin/bash
# secrets-management.sh

# Create Docker secret
echo "super-secret-password" | docker secret create db_password -

# Use in docker-compose
cat <<EOF > docker-compose.yml
version: '3.8'
services:
  app:
    image: myapp:latest
    secrets:
      - db_password
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password
secrets:
  db_password:
    external: true
EOF

# In application
const fs = require('fs');
const dbPassword = fs.readFileSync(
  process.env.DB_PASSWORD_FILE || '/run/secrets/db_password',
  'utf8'
).trim();
```

## Vulnerability Scanning Results

```
Trivy Scan Results:
═══════════════════════════════════════════════

myapp:latest (alpine 3.18.0)
Total: 2 (HIGH: 2, CRITICAL: 0)

┌─────────────┬────────────────┬──────────┬────────┬─────────────────────┐
│   Library   │ Vulnerability  │ Severity │ Status │     Fixed Version   │
├─────────────┼────────────────┼──────────┼────────┼─────────────────────┤
│ libcrypto3  │ CVE-2023-2650  │  HIGH    │ fixed  │ 3.0.9-r1           │
│ libssl3     │ CVE-2023-2650  │  HIGH    │ fixed  │ 3.0.9-r1           │
└─────────────┴────────────────┴──────────┴────────┴─────────────────────┘
```

## Runtime Protection with Falco

```yaml
# falco-rules.yaml
- rule: Unauthorized Process
  desc: Detect unauthorized process started in container
  condition: >
      container and
      proc.name not in (allowed_processes) and
      not proc.pname in (shell_binaries)
  output: >
      Unauthorized process started in container
      (user=%user.name container=%container.name
       process=%proc.name parent=%proc.pname)
  priority: WARNING

- rule: Write below etc
  desc: Detect writes to /etc directory
  condition: >
      container and
      write and
      fd.name startswith /etc
  output: >
      File written under /etc in container
      (user=%user.name container=%container.name
       file=%fd.name)
  priority: ERROR

- rule: Container Shell Spawned
  desc: Detect shell spawned in container
  condition: >
      container and
      proc.name in (shell_binaries) and
      spawned_process
  output: >
      Shell spawned in container
      (user=%user.name container=%container.name
       shell=%proc.name parent=%proc.pname)
  priority: WARNING
```

## Security Monitoring Dashboard

```
Container Security Metrics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vulnerabilities by Severity:
CRITICAL ░░░░░░░░░░ 0
HIGH     ███░░░░░░░ 3
MEDIUM   ██████░░░░ 12
LOW      ████████░░ 28

Compliance Score: 94/100
├─ CIS Docker Benchmark: 92%
├─ PCI DSS: 96%
└─ NIST: 94%

Runtime Anomalies (Last 24h):
├─ Unauthorized Process: 0
├─ Suspicious Network: 2
├─ File System Changes: 5
└─ Privilege Escalation: 0
```

## Image Signing and Verification

```bash
# Sign image with Cosign
cosign sign --key cosign.key myregistry.io/myapp:v1.0.0

# Verify image signature
cosign verify --key cosign.pub myregistry.io/myapp:v1.0.0

# Policy enforcement with OPA
cat <<EOF > image-policy.rego
package docker.authz

default allow = false

allow {
    input.Body.object.metadata.annotations["cosign.sigstore.dev/signature"]
    verified := verify_signature(input.Body.object)
    verified == true
}
EOF
```

## Best Practices Summary

1. **Minimize attack surface** - Use minimal base images
2. **Scan regularly** - Integrate security scanning in CI/CD
3. **Least privilege** - Drop unnecessary capabilities
4. **Immutable infrastructure** - Use read-only filesystems
5. **Network segmentation** - Implement strict network policies
6. **Secrets management** - Never hardcode secrets
7. **Runtime protection** - Monitor and alert on anomalies
8. **Regular updates** - Keep images and dependencies updated
9. **Image signing** - Verify image integrity
10. **Audit logging** - Enable comprehensive logging

Security is not a one-time task but a continuous process. Stay vigilant and keep learning!
