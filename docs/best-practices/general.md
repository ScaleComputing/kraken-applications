# General Best Practices

This guide covers essential best practices for creating robust, maintainable, and efficient Kraken applications.

## Manifest Organization

### 1. Use Descriptive Names

✅ **Good**:
```yaml
name: "web-server-prod"
resources:
  - name: "frontend-vm"
  - name: "database-vm"
```

❌ **Avoid**:
```yaml
name: "app1"
resources:
  - name: "vm1"
  - name: "vm2"
```

### 2. Consistent Labeling

```yaml
labels:
  - "environment:{{ env }}"
  - "team:{{ team }}"
  - "application:{{ app_name }}"
  - "version:{{ version }}"
```

### 3. Template Variables

Use variables for dynamic values:

```yaml
metadata:
  name: "{{ app_name }}-{{ env }}"
  labels:
    - "instance:{{ instance_id }}"
```

## Resource Sizing

### Memory Guidelines

| Application Type | Recommended Memory |
|------------------|--------------------|
| Web Server | 2-4 GB |
| Database | 8-16 GB |
| Application Server | 4-8 GB |
| Development VM | 2-4 GB |

### CPU Allocation

- **Web servers**: 2-4 cores
- **Databases**: 4-8 cores
- **Compute workloads**: 8+ cores
- **Development**: 1-2 cores

### Storage Planning

```yaml
storage_devices:
  - name: "os-disk"
    capacity: 32212254720   # 30 GB - OS and apps
    boot: 1
  - name: "data-disk"
    capacity: 107374182400  # 100 GB - Application data
```

## Configuration Management

### Environment-Specific Values

```yaml
# Use template variables
cpu: "{{ cpu_count | default(2) }}"
memory: "{{ memory_size | default('4294967296') }}"

# Environment-specific labels
labels:
  - "environment:{{ env }}"
  - "monitoring:{{ monitoring_enabled | default('true') }}"
```

### Asset Management

```yaml
# Version your assets
assets:
  - name: "app-image"
    type: "virtual_disk"
    format: "raw"
    url: "https://assets.company.com/app-v1.2.3.img"
```

## State Management

### Template VMs

```yaml
# Create templates in shutoff state
spec:
  state: "shutoff"
  tags:
    - "template"
    - "base-image"
```

### Production VMs

```yaml
# Production VMs should be running
spec:
  state: "running"
  tags:
    - "production"
    - "monitored"
```

## Documentation

### Inline Documentation

```yaml
spec:
  resources:
    - type: virdomain
      name: "web-server"
      spec:
        description: "Nginx web server with SSL termination and caching"
        # Resource configuration follows...
```

### README Files

Include README.md with each manifest:

```markdown
# Web Server Application

## Overview
This manifest deploys a high-availability web server.

## Requirements
- Minimum 4 GB RAM
- 50 GB storage
- HTTPS asset access

## Deployment
1. Update template variables
2. Submit to Fleet Manager
3. Monitor deployment status
```

## Version Control

### Git Best Practices

```bash
# Organize manifests by environment
manifests/
├── production/
│   ├── web-server.yaml
│   └── database.yaml
├── staging/
│   ├── web-server.yaml
│   └── database.yaml
└── development/
    └── test-app.yaml
```

### Commit Messages

```bash
# Good commit messages
git commit -m "Add production web server manifest"
git commit -m "Update memory allocation for database VM"
git commit -m "Fix asset URL in development environment"
```

## Testing

### Validation

```bash
# Validate before deployment
jsonschema -i manifest.yaml schema.json
```

### Staging First

1. Test in development environment
2. Validate in staging
3. Deploy to production

## Monitoring and Maintenance

### Tagging for Monitoring

```yaml
tags:
  - "monitoring:enabled"
  - "alerts:critical"
  - "backup:daily"
```

### Resource Tracking

```yaml
labels:
  - "cost-center:engineering"
  - "owner:platform-team"
  - "project:web-infrastructure"
```

## Common Patterns

### Multi-Tier Applications

```yaml
# Web tier
- name: "web-tier"
  spec:
    cpu: 2
    memory: "4294967296"
    tags: ["web", "frontend"]

# App tier
- name: "app-tier"
  spec:
    cpu: 4
    memory: "8589934592"
    tags: ["app", "backend"]

# Data tier
- name: "data-tier"
  spec:
    cpu: 4
    memory: "16106127360"
    tags: ["database", "data"]
```

### Development vs Production

```yaml
# Development
cpu: "{{ dev_cpu | default(1) }}"
memory: "{{ dev_memory | default('2147483648') }}"

# Production
cpu: "{{ prod_cpu | default(4) }}"
memory: "{{ prod_memory | default('8589934592') }}"
```

## Troubleshooting

### Common Issues

1. **Asset URL failures**: Use HTTPS and verify accessibility
2. **Memory format errors**: Always use string format for memory
3. **Name conflicts**: Ensure unique names within manifest
4. **Boot order issues**: Set proper boot priorities

### Debugging Tips

1. Start with minimal configurations
2. Test one component at a time
3. Use descriptive names for easier identification
4. Monitor deployment logs

## Related Documentation

- [Schema Reference](../spec/schema.md)