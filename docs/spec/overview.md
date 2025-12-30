# Manifest Specification Overview

The Kraken manifest specification defines the structure and schema for declaratively describing applications and their infrastructure requirements. This specification enables consistent, version-controlled deployment of complex applications across Scale Computing's HyperCore infrastructure.

## Schema Version

Current specification version: **1.0.0**

All manifests must declare their schema version:

```yaml
version: "1.0.0"
```

## Manifest Structure

Every Kraken manifest follows this top-level structure:

```yaml
type: Application              # Resource type (always "Application")
version: "1.0.0"              # Schema version
metadata:                     # Application metadata
  name: string                # Required: Application name
  labels: []                  # Optional: Classification labels
spec:                         # Required: Application specification
  assets: []                  # Optional: External resources
  resources: []               # Required: Infrastructure components
```

## Type System

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Must be "Application" |
| `version` | string | Schema version (e.g., "1.0.0") |
| `metadata.name` | string | Unique application identifier |
| `spec.resources` | array | List of infrastructure resources |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `metadata.labels` | array | Classification and organization labels |
| `spec.assets` | array | External assets (disk images, ISOs, etc.) |

## Resource Types

### VirDomain

Virtual machine resource type for deploying VMs:

```yaml
resources:
  - type: virdomain
    name: "my-vm"
    spec:
      description: "Virtual machine description"
      cpu: 2
      memory: "4 GiB"
      machine_type: "uefi"
      state: "running"
```

**[Full VirDomain Reference →](virdomain.md)**

## Asset Types

### Virtual Disk

External disk images for VM storage:

```yaml
assets:
  - name: "ubuntu-image"
    type: "virtual_disk"
    format: "raw"
    url: "https://example.com/ubuntu.img"
```

**[Full Assets Reference →](assets.md)**

## Data Types

### Memory Values

Memory can be specified in human readable formats, or bytes:

```yaml
memory: 4 GiB
memory: 16 GiB
memory: "4294967296"    # 4 GB
memory: "17179869184"   # 16 GB
```

### Storage Capacity

Storage capacity can be specified in human readable formats, or bytes:

```yaml
capacity: 50 GB
capacity: 100 GB
capacity: 50000000000   # ~50 GB
capacity: 107374182400  # 100 GB
```

### Template Variables

!!! note

    The template variable names and syntax are an experimental feature and subject to change.

Fleet Manager supports the following dynamic values:

- `clusterName`: the name of the target cluster
- `clusterId`: the ID of the target cluster

Values can be included in the manifest using the following template syntax:

```yaml
resources:
  - type: virdomain
    name: "vm-{{ clusterName }}"
    description: "This VM is on cluster_name={{clusterName}} cluster_id={{clusterId}}"
```

!!! tip

    Kraken uses the application `metadata.name` field to uniquely identify applications. Due to this behavior, it is recommended to use dynamic values in resource definitions only and not in application metadata to avoid creating duplicate applications.

## Validation Rules

### Naming Conventions

- **Application names**: Must be unique, lowercase, alphanumeric with hyphens or underscores
- **Resource names**: Must be unique within the manifest.
- **Asset names**: Must be unique within the manifest.

### Resource Constraints

- **CPU**: Minimum 1 (vCPU Core), maximum depends on cluster capacity
- **Memory**: Minimum 100 MiB, maximum depends on cluster capacity
- **Storage**: Minimum 1GB, maximum depends on cluster capacity

### Asset Requirements

- **URLs**: Must be publicly accessible HTTPS URLs
- **Formats**: Supported formats: raw, iso (support for .qcow2, .vmdk, etc. coming by end of 2025)
- **Size**: Assets should be optimized for network transfer

## Schema Validation

Manifests are validated against JSON Schema during processing:

```yaml
# Valid manifest structure
{
  "$schema": "https://kraken.scale.com/schema/v1.0.0/application.json",
  "type": "object",
  "required": ["type", "version", "metadata", "spec"],
  "properties": {
    "type": {"const": "Application"},
    "version": {"const": "1.0.0"},
    "metadata": {
      "type": "object",
      "required": ["name"],
      "properties": {
        "name": {"type": "string"},
        "labels": {"type": "array"}
      }
    },
    "spec": {
      "type": "object",
      "required": ["resources"],
      "properties": {
        "assets": {"type": "array"},
        "resources": {"type": "array"}
      }
    }
  }
}
```
For the full schema and details on it's use, check out the [schema reference](https://scalecomputing.github.io/kraken-applications/spec/schema/) page.

## Version Compatibility

### Current Version (1.0.0)

- Initial stable release
- Full feature set supported
- Backward compatible with pre-1.0 manifests


## Extensions and Custom Fields

### Labels

Use labels for organization and automation:

```yaml
metadata:
  labels:
    - "environment:production"
    - "team:platform"
    - "cost-center:engineering"
    - "backup:daily"
```

### Tags

Apply tags to resources for classification:

```yaml
resources:
  - type: virdomain
    spec:
      tags:
        - "web-server"
        - "production"
        - "monitoring"
```

## Best Practices

### 1. Schema Validation

Always validate manifests before deployment:

```bash
# Example validation command
kraken validate manifest.yaml
```

### 2. Version Pinning

Use explicit version strings:

```yaml
# ✅ Good
version: "1.0.0"

# ❌ Avoid
version: 1
```

### 3. Resource Naming

Use descriptive, consistent names:

```yaml
# ✅ Good
name: "web-server-prod"

# ❌ Avoid
name: "vm1"
```

### 4. Documentation

Include descriptions for complex configurations:

```yaml
resources:
  - type: virdomain
    spec:
      description: "Production web server with load balancer configuration"
```

## Error Handling

### Common Validation Errors

1. **Invalid resource type**: Ensure `type: "virdomain"` is correct
2. **Missing required fields**: Check that all required fields are present
3. **Invalid memory format**: Use string format for memory values
4. **Unreachable assets**: Verify asset URLs are accessible

### Debugging Tips

1. Use schema validation tools
2. Check logs for detailed error messages
3. Test with minimal manifests first
4. Validate asset URLs independently

## Next Steps

- **[Metadata Reference](metadata.md)** - Learn about metadata structure
- **[Assets Reference](assets.md)** - Understand asset management
- **[VirDomain Reference](virdomain.md)** - Deep dive into VM specification
- **[Schema Reference](schema.md)** - Complete schema documentation
