# General Best Practices

This guide covers general best practices for creating robust, maintainable, and efficient Kraken applications. For more detailed troubleshooting and bets practices, see the releavnt section over in the Manifest Schema portion of the documentation.

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

## Resource Sizing

### Memory Guidelines

| Application Type | Recommended Memory |
|------------------|--------------------|
| Web Server | 2-4 GiB |
| Database | 8-16 GiB |
| Application Server | 4-8 GiB |
| Development VM | 2-4 GiB |

### CPU Allocation

- **Web servers**: 2-4 cores
- **Databases**: 4-8 cores
- **Compute workloads**: 8+ cores
- **Development**: 1-2 cores

### Storage Planning

```yaml
storage_devices:
  - name: "os-disk"
    capacity: 30 GB   # OS
    boot: 1
  - name: "data-disk"
    capacity: 100 GB  # Application data
```

## Configuration Management

### Variables

There are currently two "native" variables to help ensure cluster-specific names for resources, such as VMs
- {{clusterName}} - inserts the name of the target cluster at time of deployment
- {{clusterId}} - Inserts the 36-character UUID of the target cluster
Ex. If your clusters are named Store 1, Store 2, Store 3, etc. you can specify your POS vm name as "POS-{{cluster_name}}" so that the deployed VMs are all unique and clearly identified by store "POS-Store1", etc..

YAML anchors are also supported, to help avoid repetition in longer manifests, and make manifests easier to maintain.
Check out the [Gitlab documentation](https://docs.gitlab.com/ci/yaml/yaml_optimization/) to learn more.

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
  cpu: 0
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

Leverage the [Schema Reference](https://scalecomputing.github.io/kraken-applications/spec/schema/) page to validate your Kraken Manifests against the json shcema early and often.

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
    memory: 4 GiB
    tags: ["web", "frontend"]

# App tier
- name: "app-tier"
  spec:
    cpu: 4
    memory: 8 GiB
    tags: ["app", "backend"]

# Data tier
- name: "data-tier"
  spec:
    cpu: 4
    memory: 16 GiB
    tags: ["database", "data"]
```


## Troubleshooting

### Common Issues

1. **Asset URL failures**: Use HTTPS and verify accessibility
2. **Name conflicts**: Ensure unique names within manifest
3. **Boot order issues**: Set proper boot priorities

### Debugging Tips

1. Start with minimal configurations
2. Test one component at a time
3. Use descriptive names for easier identification
4. Monitor deployment logs

## Related Documentation

- [Schema Reference](../spec/schema.md)
