# Metadata Specification

The metadata section contains information about your application including identification, classification, and organizational details.

## Structure

```yaml
metadata:
  name: "application-name"
  labels:
    - "environment:production"
    - "team:platform"
```

## Required Fields

### name
- **Type**: `string`
- **Description**: Unique application identifier
- **Constraints**: DNS-1123 compliant, lowercase, alphanumeric with hyphens
- **Example**: `"web-server-prod"`

## Optional Fields

### labels
- **Type**: `array`
- **Description**: Classification and organization labels
- **Format**: `"key:value"` strings
- **Example**: `["environment:production", "team:backend"]`

## Best Practices

1. Use descriptive names that indicate purpose
2. Include environment in labels for organization
3. Add team/ownership information
4. Use consistent labeling conventions

## Examples

### Production Application

```yaml
metadata:
  name: "web-server-prod"
  labels:
    - "environment:production"
    - "team:platform"
    - "tier:web"
    - "backup:daily"
```

### Development Application

```yaml
metadata:
  name: "test-app-dev"
  labels:
    - "environment:development"
    - "team:backend"
    - "temporary:true"
```