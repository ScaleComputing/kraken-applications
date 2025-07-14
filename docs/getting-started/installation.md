# Installation

Learn how to set up your environment for developing and deploying Kraken applications.

## Prerequisites

- Access to Scale Computing HyperCore infrastructure
- Kraken Core API access or Fleet Manager UI
- Basic understanding of virtualization concepts

## Development Environment Setup

### YAML Editor Configuration

Configure your editor with Kraken schema validation:

```json
{
  "yaml.schemas": {
    "https://kraken.scalecomputing.com/schemas/application/v1.0.0.json": [
      "**/*manifest.yaml"
    ]
  }
}
```

### Command Line Tools

Install validation tools:

```bash
pip install jsonschema pyyaml
```

## Next Steps

- [Quick Start Guide](quickstart.md)
- [Examples](../examples/basic.md)
- [Best Practices](../best-practices/general.md)