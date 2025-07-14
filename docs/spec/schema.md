# Schema Reference

This page provides the complete JSON Schema specification for Kraken Application manifests. Use this reference for validation, tooling integration, and programmatic manifest generation.

## JSON Schema

The complete JSON Schema for Kraken Application manifests:

```json title="kraken-application-schema.json"
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://kraken.scalecomputing.com/schemas/application/v1.0.0.json",
  "title": "Kraken Application Manifest",
  "description": "Schema for Kraken Application manifests version 1.0.0",
  "type": "object",
  "required": ["type", "version", "metadata", "spec"],
  "properties": {
    "type": {
      "type": "string",
      "const": "Application",
      "description": "Resource type identifier"
    },
    "version": {
      "type": "string",
      "const": "1.0.0",
      "description": "Schema version"
    },
    "metadata": {
      "$ref": "#/definitions/metadata"
    },
    "spec": {
      "$ref": "#/definitions/spec"
    }
  },
  "additionalProperties": false,
  "definitions": {
    "metadata": {
      "type": "object",
      "required": ["name"],
      "properties": {
        "name": {
          "type": "string",
          "pattern": "^[a-z0-9]([-a-z0-9]*[a-z0-9])?$",
          "maxLength": 63,
          "description": "Application name (DNS-1123 compliant)"
        },
        "labels": {
          "type": "array",
          "items": {
            "type": "string",
            "pattern": "^[a-zA-Z0-9]([-a-zA-Z0-9_.]*[a-zA-Z0-9])?$",
            "maxLength": 63
          },
          "description": "Classification and organization labels"
        }
      },
      "additionalProperties": false
    },
    "spec": {
      "type": "object",
      "required": ["resources"],
      "properties": {
        "assets": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/asset"
          },
          "description": "External assets (disk images, ISOs, etc.)"
        },
        "resources": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/resource"
          },
          "minItems": 1,
          "description": "Infrastructure resources"
        }
      },
      "additionalProperties": false
    },
    "asset": {
      "type": "object",
      "required": ["name", "type", "format", "url"],
      "properties": {
        "name": {
          "type": "string",
          "pattern": "^[a-z0-9]([-a-z0-9]*[a-z0-9])?$",
          "maxLength": 63,
          "description": "Asset identifier"
        },
        "type": {
          "type": "string",
          "enum": ["virtual_disk"],
          "description": "Asset type"
        },
        "format": {
          "type": "string",
          "enum": ["raw", "qcow2", "iso"],
          "description": "Asset format"
        },
        "url": {
          "type": "string",
          "format": "uri",
          "pattern": "^https://",
          "description": "Asset download URL (HTTPS required)"
        }
      },
      "additionalProperties": false
    },
    "resource": {
      "type": "object",
      "required": ["type", "name", "spec"],
      "properties": {
        "type": {
          "type": "string",
          "enum": ["virdomain"],
          "description": "Resource type"
        },
        "name": {
          "type": "string",
          "pattern": "^[a-z0-9]([-a-z0-9]*[a-z0-9])?$",
          "maxLength": 63,
          "description": "Resource identifier"
        },
        "spec": {
          "$ref": "#/definitions/virdomain_spec"
        }
      },
      "additionalProperties": false
    },
    "virdomain_spec": {
      "type": "object",
      "required": ["cpu", "memory", "machine_type", "state"],
      "properties": {
        "description": {
          "type": "string",
          "maxLength": 255,
          "description": "Human-readable description"
        },
        "cpu": {
          "type": "integer",
          "minimum": 1,
          "maximum": 128,
          "description": "Number of virtual CPU cores"
        },
        "memory": {
          "type": "string",
          "pattern": "^[0-9]+$",
          "description": "Memory allocation in bytes (as string)"
        },
        "machine_type": {
          "type": "string",
          "enum": ["uefi", "bios", "tpm"],
          "description": "Virtual machine firmware type"
        },
        "state": {
          "type": "string",
          "enum": ["running", "shutoff"],
          "description": "Desired VM power state"
        },
        "storage_devices": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/storage_device"
          },
          "description": "Storage devices"
        },
        "network_devices": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/network_device"
          },
          "description": "Network interfaces"
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string",
            "pattern": "^[a-zA-Z0-9]([-a-zA-Z0-9_.]*[a-zA-Z0-9])?$",
            "maxLength": 63
          },
          "description": "Classification tags"
        },
        "cloud_init_data": {
          "$ref": "#/definitions/cloud_init_data"
        }
      },
      "additionalProperties": false
    },
    "storage_device": {
      "type": "object",
      "required": ["name", "type"],
      "properties": {
        "name": {
          "type": "string",
          "pattern": "^[a-z0-9]([-a-z0-9]*[a-z0-9])?$",
          "maxLength": 63,
          "description": "Storage device identifier"
        },
        "type": {
          "type": "string",
          "enum": ["virtio_disk", "ide_cdrom"],
          "description": "Storage device type"
        },
        "source": {
          "type": "string",
          "description": "Reference to asset name"
        },
        "capacity": {
          "type": "integer",
          "minimum": 1073741824,
          "maximum": 1099511627776,
          "description": "Storage capacity in bytes (1GB to 1TB)"
        },
        "boot": {
          "type": "integer",
          "minimum": 1,
          "maximum": 255,
          "description": "Boot priority (1=primary)"
        }
      },
      "additionalProperties": false,
      "anyOf": [
        {
          "required": ["source"]
        },
        {
          "required": ["capacity"]
        }
      ]
    },
    "network_device": {
      "type": "object",
      "required": ["name", "type"],
      "properties": {
        "name": {
          "type": "string",
          "pattern": "^[a-z0-9]([-a-z0-9]*[a-z0-9])?$",
          "maxLength": 63,
          "description": "Network interface identifier"
        },
        "type": {
          "type": "string",
          "enum": ["virtio"],
          "description": "Network device type"
        }
      },
      "additionalProperties": false
    },
    "cloud_init_data": {
      "type": "object",
      "properties": {
        "user_data": {
          "type": "string",
          "description": "Cloud-init user data (YAML)"
        },
        "meta_data": {
          "type": "string",
          "description": "Cloud-init metadata (YAML)"
        }
      },
      "additionalProperties": false
    }
  }
}
```

## Validation Examples

### Valid Manifest

```yaml
type: Application
version: "1.0.0"
metadata:
  name: "valid-example"
  labels:
    - "environment:production"
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
        description: "Production web server"
        cpu: 2
        memory: "4294967296"
        machine_type: "uefi"
        state: "running"
        storage_devices:
          - name: "root-disk"
            type: "virtio_disk"
            source: "ubuntu-image"
            capacity: 53687091200
            boot: 1
        network_devices:
          - name: "eth0"
            type: "virtio"
        tags:
          - "web-server"
          - "production"
```

### Common Validation Errors

#### 1. Missing Required Fields

```yaml
# ❌ Invalid - missing required fields
type: Application
metadata:
  name: "incomplete-example"
# Missing: version, spec
```

**Error**: Required properties are missing.

#### 2. Invalid Memory Format

```yaml
# ❌ Invalid - memory as number
spec:
  resources:
    - type: virdomain
      spec:
        memory: 4294967296  # Should be string
```

**Error**: Memory must be specified as a string.

#### 3. Invalid Asset URL

```yaml
# ❌ Invalid - non-HTTPS URL
assets:
  - name: "image"
    type: "virtual_disk"
    format: "raw"
    url: "http://example.com/image.img"  # Must be HTTPS
```

**Error**: Asset URLs must use HTTPS protocol.

#### 4. Invalid Resource Name

```yaml
# ❌ Invalid - uppercase and special characters
resources:
  - type: virdomain
    name: "My_Server!"  # Must be lowercase, alphanumeric with hyphens
```

**Error**: Resource names must follow DNS-1123 naming convention.

## Schema Validation Tools

### Command Line Validation

Using `jsonschema` (Python):

```bash
# Install jsonschema
pip install jsonschema

# Validate manifest
python -c "
import json, yaml
from jsonschema import validate

# Load schema
with open('kraken-schema.json') as f:
    schema = json.load(f)

# Load and validate manifest
with open('manifest.yaml') as f:
    manifest = yaml.safe_load(f)

validate(manifest, schema)
print('Manifest is valid!')
"
```

### Programming Language Examples

#### Python

```python
import json
import yaml
from jsonschema import validate, ValidationError

def validate_manifest(manifest_path, schema_path):
    try:
        with open(schema_path) as f:
            schema = json.load(f)
        
        with open(manifest_path) as f:
            manifest = yaml.safe_load(f)
        
        validate(manifest, schema)
        return True, "Manifest is valid"
    
    except ValidationError as e:
        return False, f"Validation error: {e.message}"
    except Exception as e:
        return False, f"Error: {str(e)}"

# Usage
valid, message = validate_manifest('manifest.yaml', 'schema.json')
print(message)
```

#### JavaScript/Node.js

```javascript
const Ajv = require('ajv');
const yaml = require('js-yaml');
const fs = require('fs');

function validateManifest(manifestPath, schemaPath) {
    try {
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));
        
        const ajv = new Ajv();
        const validate = ajv.compile(schema);
        
        const valid = validate(manifest);
        
        if (!valid) {
            return { valid: false, errors: validate.errors };
        }
        
        return { valid: true, message: 'Manifest is valid' };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

// Usage
const result = validateManifest('manifest.yaml', 'schema.json');
console.log(result);
```

## IDE Integration

### VS Code

Create `.vscode/settings.json`:

```json
{
  "yaml.schemas": {
    "https://kraken.scalecomputing.com/schemas/application/v1.0.0.json": [
      "**/*manifest.yaml",
      "**/*kraken*.yaml"
    ]
  },
  "yaml.format.enable": true,
  "yaml.validate": true
}
```

### IntelliJ IDEA

1. Go to **Settings** → **Languages & Frameworks** → **Schemas and DTDs** → **JSON Schema Mappings**
2. Add new mapping:
   - **Schema URL**: `https://kraken.scalecomputing.com/schemas/application/v1.0.0.json`
   - **File pattern**: `**/manifest.yaml`

## Custom Validation Rules

### Business Logic Validation

Additional validation beyond schema:

```python
def validate_business_rules(manifest):
    errors = []
    
    # Check memory allocation
    for resource in manifest.get('spec', {}).get('resources', []):
        if resource.get('type') == 'virdomain':
            spec = resource.get('spec', {})
            memory = int(spec.get('memory', '0'))
            cpu = spec.get('cpu', 0)
            
            # Memory should be at least 1GB per CPU core
            if memory < cpu * 1073741824:
                errors.append(f"Resource {resource['name']}: "
                            f"Memory too low for CPU count")
    
    # Check asset references
    asset_names = {asset['name'] for asset in 
                   manifest.get('spec', {}).get('assets', [])}
    
    for resource in manifest.get('spec', {}).get('resources', []):
        if resource.get('type') == 'virdomain':
            for device in resource.get('spec', {}).get('storage_devices', []):
                source = device.get('source')
                if source and source not in asset_names:
                    errors.append(f"Unknown asset reference: {source}")
    
    return errors
```

### Naming Convention Validation

```python
def validate_naming_conventions(manifest):
    errors = []
    
    # Check application name follows convention
    name = manifest.get('metadata', {}).get('name', '')
    if not name.startswith('mycompany-'):
        errors.append("Application name must start with 'mycompany-'")
    
    # Check resource naming
    for resource in manifest.get('spec', {}).get('resources', []):
        if not resource.get('name', '').endswith('-vm'):
            errors.append(f"Resource {resource['name']} must end with '-vm'")
    
    return errors
```

## Schema Evolution

### Version Compatibility

| Schema Version | Compatibility | Notes |
|----------------|---------------|--------|
| 1.0.0 | Current | Stable API |
| 1.1.0 | Backward Compatible | Future additions |
| 2.0.0 | Breaking Changes | Major revision |

### Migration Support

```python
def migrate_manifest(manifest, target_version):
    current_version = manifest.get('version', '1.0.0')
    
    if current_version == '1.0.0' and target_version == '1.1.0':
        # Add new optional fields with defaults
        manifest['version'] = '1.1.0'
        
        # Add new metadata fields
        if 'metadata' not in manifest:
            manifest['metadata'] = {}
        
        manifest['metadata'].setdefault('annotations', {})
    
    return manifest
```

## Related Documentation

- **[Manifest Overview](overview.md)** - High-level specification
- **[VirDomain Reference](virdomain.md)** - Virtual machine specification
- **[Assets Reference](assets.md)** - Asset management
- **[Examples](../examples/basic.md)** - Practical examples