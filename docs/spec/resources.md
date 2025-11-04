# Resources Specification

Resources define the infrastructure components that make up your Kraken application. Currently, the only resource type is `virdomain` (virtual machines), but the specification is designed to support additional resource types in the future.

## Resource Structure

All resources in a Kraken manifest follow this basic structure:

```yaml
spec:
  resources:
    - type: "resource-type"
      name: "unique-resource-name"
      spec:
        # Resource-specific configuration
```

## Required Fields

### type
- **Type**: `string`
- **Description**: The resource type identifier
- **Current Values**: `"virdomain"`
- **Future Values**: May include containers, networks, storage volumes, etc.

### name
- **Type**: `string`
- **Description**: Unique identifier for the resource within the manifest
- **Constraints**: Must be unique within the manifest, DNS-1123 compliant

### spec
- **Type**: `object`
- **Description**: Resource-specific configuration object
- **Contents**: Varies by resource type

## Resource Types

### VirDomain

Virtual machine resources for deploying VMs on HyperCore infrastructure.

```yaml
resources:
  - type: "virdomain"
    name: "my-vm"
    spec:
      description: "Virtual machine description"
      cpu: 2
      memory: 4 GiB
      machine_type: "uefi"
      state: "running"
      storage_devices: []
      network_devices: []
      tags: []
      cloud_init_data: {}
```

**[Complete VirDomain Reference →](virdomain.md)**

## Resource Naming

### Naming Rules

- Must be lowercase
- Must start and end with alphanumeric characters
- May contain hyphens (`-`) in the middle
- Maximum 63 characters
- Must be unique within the manifest

### Good Examples

```yaml
# ✅ Good names
- name: "web-server"
- name: "database-01"
- name: "app-tier"
- name: "load-balancer"
```

### Bad Examples

```yaml
# ❌ Bad names
- name: "Web_Server"     # Uppercase and underscore
- name: "database.01"    # Contains period
- name: "-web-server"    # Starts with hyphen
- name: "web-server-"    # Ends with hyphen
```

## Resource Dependencies

### Implicit Dependencies

Resources can reference other resources or assets:

```yaml
spec:
  assets:
    - name: "ubuntu-image"
      type: "virtual_disk"
      format: "raw"
      url: "https://example.com/ubuntu.img"
  
  resources:
    - type: "virdomain"
      name: "web-server"
      spec:
        storage_devices:
          - name: "root-disk"
            type: "virtio_disk" # Ensure type is appropriate for the source's asset format. ISOs must be attached as type "ide_cdrom"
            source: "ubuntu-image"  # References the asset
```

### Deployment Order

- **Assets** are processed first
- **Resources** are processed after assets are available
- Within resources, there's no guaranteed order (design for independence)

## Resource Lifecycle

### States

Resources have different lifecycle states:

```yaml
# Running state
state: "running"

# Stopped state  
state: "shutoff"
```

### Management

- **Creation**: Resources are created when the manifest is deployed
- **Updates**: Changes to resource specifications trigger updates
- **Deletion**: Resources are removed when the manifest is deleted

## Common Patterns

### Multi-Tier Applications

```yaml
resources:
  - type: "virdomain"
    name: "web-tier"
    spec:
      # Web server configuration
      tags: ["web", "frontend"]
  
  - type: "virdomain"
    name: "app-tier"
    spec:
      # Application server configuration
      tags: ["app", "backend"]
  
  - type: "virdomain"
    name: "data-tier"
    spec:
      # Database configuration
      tags: ["database", "data"]
```

### Template and Instance Pattern

```yaml
resources:
  # Template VM (stopped)
  - type: "virdomain"
    name: "base-template"
    spec:
      state: "shutoff"
      tags: ["template"]
  
  # Production instance (running)
  - type: "virdomain"
    name: "prod-instance"
    spec:
      state: "running"
      tags: ["production"]
```


## Resource Validation

### Schema Validation

All resources are validated against the Kraken schema:

- **Type checking**: Ensures proper data types
- **Required fields**: Validates all required fields are present
- **Constraints**: Checks naming rules and value ranges
- **References**: Validates asset and resource references

### Best Practices

1. **Use descriptive names** that indicate purpose
2. **Include descriptions** for complex resources
3. **Tag consistently** for organization
4. **Size appropriately** for workload requirements
5. **Plan dependencies** carefully
6. **Test in development** before production

## Error Handling

### Common Resource Errors

1. **Invalid resource type**: Unsupported resource type
2. **Duplicate names**: Resource names must be unique
3. **Missing required fields**: All required fields must be present
4. **Invalid references**: Referenced assets must exist
5. **Constraint violations**: Values must meet requirements

### Debugging Tips

- Check resource names for uniqueness
- Verify all required fields are present
- Validate asset references exist
- Review constraint violations
- Test with minimal configurations first

## Future Resource Types

The resource specification is designed to support additional resource types:

### Potential Future Resource Types

- **Container**: Container-based applications
- **Network**: Network configurations and VLANs
- **Storage**: Persistent storage volumes
- **Service**: Service definitions and load balancers
- **Secret**: Secure configuration management

### Extensibility

The resource specification supports:

- **Versioning**: Schema evolution support
- **Validation**: Extensible validation rules

## Related Documentation

- **[VirDomain Reference](virdomain.md)** - Virtual machine specification
- **[Assets Reference](assets.md)** - Asset management
- **[Schema Reference](schema.md)** - Complete schema documentation
- **[Examples](../examples/basic.md)** - Practical examples
