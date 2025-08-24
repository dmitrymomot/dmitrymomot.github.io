---
title: "Terraform Best Practices: Infrastructure as Code Patterns"
description: "Learn advanced Terraform patterns for managing complex infrastructure at scale"
publishDate: 2025-07-25
tags: ["terraform", "infrastructure", "devops", "cloud", "iac"]
draft: false
---

Managing infrastructure with Terraform goes beyond writing HCL files. Let's explore patterns for building maintainable, scalable infrastructure as code.

## Project Structure

```
terraform-infrastructure/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── production/
├── modules/
│   ├── networking/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   ├── compute/
│   ├── database/
│   └── monitoring/
├── global/
│   ├── iam/
│   └── dns/
└── scripts/
    ├── init.sh
    └── plan.sh
```

## Module Design Patterns

### Composable Modules

```hcl
# modules/app-stack/main.tf
module "networking" {
  source = "../networking"

  vpc_cidr     = var.vpc_cidr
  environment  = var.environment
  region       = var.region
}

module "compute" {
  source = "../compute"

  vpc_id          = module.networking.vpc_id
  subnet_ids      = module.networking.private_subnet_ids
  instance_type   = var.instance_type
  min_size        = var.min_size
  max_size        = var.max_size
}

module "database" {
  source = "../database"

  vpc_id              = module.networking.vpc_id
  subnet_ids          = module.networking.database_subnet_ids
  instance_class      = var.db_instance_class
  allocated_storage   = var.db_storage
  backup_retention    = var.backup_retention
}

module "monitoring" {
  source = "../monitoring"

  cluster_name    = module.compute.cluster_name
  database_id     = module.database.db_instance_id
  sns_email       = var.alert_email
}
```

## State Management Strategy

### Remote State with Locking

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "env/production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
    kms_key_id     = "arn:aws:kms:us-east-1:123456789:key/abc-123"
  }
}

# State lock table
resource "aws_dynamodb_table" "terraform_lock" {
  name           = "terraform-state-lock"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "Terraform State Lock"
    Environment = "global"
    ManagedBy   = "terraform"
  }
}
```

## Dynamic Configuration

### Using Locals and Data Sources

```hcl
locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Team        = var.team
    CostCenter  = var.cost_center
    Timestamp   = timestamp()
  }

  # Environment-specific configuration
  env_config = {
    dev = {
      instance_type = "t3.micro"
      min_size      = 1
      max_size      = 2
    }
    staging = {
      instance_type = "t3.small"
      min_size      = 2
      max_size      = 4
    }
    production = {
      instance_type = "t3.large"
      min_size      = 3
      max_size      = 10
    }
  }

  current_config = local.env_config[var.environment]
}

# Data source for AMI
data "aws_ami" "app" {
  most_recent = true
  owners      = ["self"]

  filter {
    name   = "name"
    values = ["app-ami-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
```

## Loop and Conditional Patterns

### For Each with Complex Objects

```hcl
variable "services" {
  type = map(object({
    port        = number
    protocol    = string
    health_path = string
    priority    = number
  }))

  default = {
    api = {
      port        = 8080
      protocol    = "HTTP"
      health_path = "/health"
      priority    = 100
    }
    admin = {
      port        = 8081
      protocol    = "HTTPS"
      health_path = "/admin/health"
      priority    = 200
    }
  }
}

resource "aws_lb_target_group" "services" {
  for_each = var.services

  name     = "${var.app_name}-${each.key}-tg"
  port     = each.value.port
  protocol = each.value.protocol
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = each.value.health_path
    matcher             = "200"
  }

  tags = merge(local.common_tags, {
    Name    = "${var.app_name}-${each.key}-tg"
    Service = each.key
  })
}
```

## Workspace Management

```bash
#!/bin/bash
# workspace-manager.sh

ENVIRONMENT=$1
ACTION=$2

case $ACTION in
  create)
    terraform workspace new $ENVIRONMENT
    terraform init -backend-config="key=env/${ENVIRONMENT}/terraform.tfstate"
    ;;

  select)
    terraform workspace select $ENVIRONMENT
    ;;

  plan)
    terraform workspace select $ENVIRONMENT
    terraform plan -var-file="environments/${ENVIRONMENT}/terraform.tfvars"
    ;;

  apply)
    terraform workspace select $ENVIRONMENT
    terraform apply -var-file="environments/${ENVIRONMENT}/terraform.tfvars" -auto-approve
    ;;

  destroy)
    read -p "Are you sure you want to destroy ${ENVIRONMENT}? (yes/no): " confirm
    if [ "$confirm" == "yes" ]; then
      terraform workspace select $ENVIRONMENT
      terraform destroy -var-file="environments/${ENVIRONMENT}/terraform.tfvars" -auto-approve
    fi
    ;;
esac
```

## Testing Infrastructure

### Terratest Example

```go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/gruntwork-io/terratest/modules/aws"
    "github.com/stretchr/testify/assert"
)

func TestTerraformAwsNetwork(t *testing.T) {
    t.Parallel()

    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/networking",

        Vars: map[string]interface{}{
            "vpc_cidr":    "10.0.0.0/16",
            "environment": "test",
            "region":      "us-east-1",
        },
    })

    defer terraform.Destroy(t, terraformOptions)

    terraform.InitAndApply(t, terraformOptions)

    // Validate outputs
    vpcId := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcId)

    // Validate VPC exists and has correct settings
    vpc := aws.GetVpcById(t, vpcId, "us-east-1")
    assert.Equal(t, "10.0.0.0/16", vpc.CidrBlock)
}
```

## Security Patterns

### Secrets Management

```hcl
# Using AWS Secrets Manager
data "aws_secretsmanager_secret" "db_password" {
  name = "${var.environment}/database/password"
}

data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = data.aws_secretsmanager_secret.db_password.id
}

resource "aws_db_instance" "main" {
  identifier     = "${var.app_name}-db"
  engine         = "postgres"
  engine_version = "13.7"

  username = "dbadmin"
  password = data.aws_secretsmanager_secret_version.db_password.secret_string

  # Other configuration...
}

# Using HashiCorp Vault
provider "vault" {
  address = var.vault_addr
}

data "vault_generic_secret" "api_keys" {
  path = "secret/data/${var.environment}/api_keys"
}

resource "aws_ssm_parameter" "api_key" {
  name  = "/${var.environment}/api/key"
  type  = "SecureString"
  value = data.vault_generic_secret.api_keys.data["api_key"]
}
```

## Import Existing Resources

```bash
#!/bin/bash
# import-resources.sh

# Import existing VPC
terraform import aws_vpc.main vpc-12345678

# Import with for_each
terraform import 'aws_instance.web["web1"]' i-1234567890abcdef0
terraform import 'aws_instance.web["web2"]' i-0987654321fedcba0

# Generate configuration from imported resources
terraform show -json | jq '.values.root_module.resources[] | select(.address=="aws_vpc.main")' > vpc.json
```

## Cost Optimization

```hcl
# modules/compute/main.tf
resource "aws_launch_template" "app" {
  name_prefix   = "${var.app_name}-"
  image_id      = data.aws_ami.app.id
  instance_type = var.instance_type

  # Spot instance configuration
  instance_market_options {
    market_type = "spot"

    spot_options {
      max_price          = var.spot_max_price
      spot_instance_type = "one-time"
    }
  }

  # Enable detailed monitoring only in production
  monitoring {
    enabled = var.environment == "production"
  }

  # Use smaller volumes in non-production
  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size = var.environment == "production" ? 100 : 20
      volume_type = var.environment == "production" ? "gp3" : "gp2"
      encrypted   = true
    }
  }
}
```

## Terraform Cloud/Enterprise Integration

```hcl
# terraform.tf
terraform {
  cloud {
    organization = "my-company"

    workspaces {
      name = "production-infrastructure"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }

  required_version = ">= 1.3.0"
}
```

## CI/CD Pipeline

```yaml
# .github/workflows/terraform.yml
name: Terraform CI/CD

on:
    pull_request:
        paths:
            - "terraform/**"
    push:
        branches:
            - main
        paths:
            - "terraform/**"

jobs:
    terraform:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3

            - name: Setup Terraform
              uses: hashicorp/setup-terraform@v2
              with:
                  terraform_version: 1.3.0
                  cli_config_credentials_token: ${{ secrets.TF_API_TOKEN }}

            - name: Terraform Format Check
              run: terraform fmt -check -recursive

            - name: Terraform Init
              run: terraform init

            - name: Terraform Validate
              run: terraform validate

            - name: Terraform Plan
              run: terraform plan -out=tfplan

            - name: Terraform Apply
              if: github.ref == 'refs/heads/main' && github.event_name == 'push'
              run: terraform apply tfplan
```

## Monitoring and Compliance

```hcl
# Policy as Code with Sentinel (Terraform Cloud)
policy "enforce-mandatory-tags" {
  enforcement_level = "hard-mandatory"

  rule {
    all_resources_have_tags = rule {
      all tfplan.resources as _, resource {
        resource.applied.tags contains "Environment" and
        resource.applied.tags contains "Team" and
        resource.applied.tags contains "CostCenter"
      }
    }
  }
}

# Cost estimation
resource "null_resource" "cost_estimate" {
  provisioner "local-exec" {
    command = "infracost breakdown --path . --format json > cost-estimate.json"
  }

  triggers = {
    always_run = timestamp()
  }
}
```

## Performance Metrics

```
Terraform Performance Dashboard:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Plan Time: 45s
Apply Time: 3m 22s
Resources Created: 47
Resources Modified: 12
Resources Destroyed: 3

State File Size: 1.2 MB
Module Count: 8
Provider Count: 3

Cost Impact:
├─ Monthly: +$342.50
├─ Annual: +$4,110.00
└─ Savings: -$125.00/month (spot instances)
```

## Best Practices Checklist

- [ ] Use semantic versioning for modules
- [ ] Pin provider and module versions
- [ ] Implement state locking
- [ ] Use workspaces or separate state files per environment
- [ ] Validate and format code in CI/CD
- [ ] Implement cost controls and monitoring
- [ ] Use data sources instead of hardcoding
- [ ] Document modules with examples
- [ ] Test infrastructure code
- [ ] Implement proper secret management

Infrastructure as Code is a journey, not a destination. Keep iterating, keep improving, and keep your infrastructure versioned and tested.
