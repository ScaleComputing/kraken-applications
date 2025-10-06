# VirDomain Specification

The VirDomain resource type is the core component for defining virtual machines in Kraken manifests. This specification covers all configuration options, constraints, and best practices for VirDomain resources.

## Overview

VirDomain represents a virtual machine with its complete configuration including compute resources, storage, networking, and lifecycle management. Each VirDomain in a manifest must have a unique name and can be configured independently.

## Basic Structure

```yaml
resources:
  - type: virdomain
    name: "unique-vm-name"
    spec:
      description: "Human-readable description"
      cpu: 2
      memory: "4294967296"
      machine_type: "uefi"
      state: "running"
      storage_devices: []
      network_devices: []
      tags: []
      cloud_init_data: {}
```

## Required Fields

### type
- **Type**: `string`
- **Value**: `"virdomain"`
- **Description**: Resource type identifier

### name
- **Type**: `string`
- **Description**: Unique identifier for the VM within the manifest
- **Constraints**: Must be unique, alphanumeric with hyphens, lowercase preferred

### spec
- **Type**: `object`
- **Description**: VirDomain specification object containing all VM configuration


## Required Specification Fields

### cpu
- **Type**: `integer`
- **Description**: Number of virtual CPU cores
- **Minimum**: 0 (a 0 Core cannot boot, which may be desirable for templates)
- **Maximum**: 128 or cluster capacity, whichever is less
- **Example**: `cpu: 4`

### memory
- **Type**: `string`
- **Description**: RAM allocation in bytes or Integers with human readable units
- **Minimum**: 100000000 (95 MiB)
- **Maximum**: Largest Node's Free RAM capacity
- **Examples**:(All equal 4 GiB)
  - `memory: "4294967296"`
  - `memory: "4000MiB"`
  - `memory: "4GiB"`

### machine_type
- **Type**: `string`
- **Description**: Virtual machine firmware type
- **Values**:
  - `"uefi"` - Modern UEFI boot (recommended)
  - `"bios"` - Legacy BIOS boot
  - `"tpm"` - TPM-enabled for Windows security features
- **Example**: `machine_type: "uefi"`

### state
- **Type**: `string`
- **Description**: Desired VM power state
- **Values**:
  - `"running"` - VM should be powered on
  - `"shutoff"` - VM should be powered off (useful for templates)
- **Example**: `state: "running"`

## Optional Fields

### description
- **Type**: `string`
- **Description**: Human-readable description of the VM
- **Example**: `description: "Production web server with load balancer"`

### storage_devices
- **Type**: `array`
- **Description**: List of storage devices attached to the VM
- **Items**: Storage device objects [See storage_devices spec](https://scalecomputing.github.io/kraken-applications/spec/virdomain/#storage-devices)

### network_devices
- **Type**: `array`
- **Description**: List of network interfaces attached to the VM
- **Items**: Network device objects [See network_devices spec](https://scalecomputing.github.io/kraken-applications/spec/virdomain/#network-devices)

### tags
- **Type**: `array`
- **Description**: Classification tags for organization and automation
- **Items**: String tags
- **Example**: `tags: ["production", "web-server", "monitoring"]`

### cloud_init_data
- **Type**: `object`
- **Description**: Cloud-init configuration for VM initialization. [See Cloud-Init Specification](https://scalecomputing.github.io/kraken-applications/spec/cloud-init/)
- **Properties**: `user_data`, `meta_data`

## Storage Devices

Storage devices define the VM's disk configuration and boot order.

### Storage Device Schema

```yaml
storage_devices:
  - name: "device-name"
    type: "device-type"
    source: "asset-name"        # Optional: reference to asset
    capacity: 50000000000       # Optional: size in bytes
    boot: 1                     # Optional: boot priority
```

### Storage Device Types

#### virtio_disk
High-performance virtual disk (recommended):

```yaml
- name: "data-disk"
  type: "virtio_disk"
  capacity: 107374182400  # 100 GB
  boot: 1
```

#### ide_cdrom
IDE CD-ROM for ISO images:

```yaml
- name: "install-cd"
  type: "ide_cdrom"
  source: "install-iso"
  boot: 2
```

### Storage Device Properties

#### name
- **Type**: `string`
- **Description**: Unique device identifier within the VM
- **Required**: Yes

#### type
- **Type**: `string`
- **Description**: Storage device type
- **Values**: `"virtio_disk"`, `"ide_cdrom"`
- **Required**: Yes

#### source
- **Type**: `string`
- **Description**: Reference to asset name for external disk images
- **Required**: No (creates empty disk if omitted)

#### capacity
- **Type**: `integer`
- **Description**: Storage capacity in bytes
- **Required**: Only for disks without source
- **Example**: `capacity: 53687091200` (50 GB)

#### boot
- **Type**: `integer`
- **Description**: Boot priority (1=primary, 2=secondary, etc.)
- **Required**: No
- **Example**: `boot: 1`

## Network Devices

Network devices define the VM's network connectivity.

### Network Device Schema

```yaml
network_devices:
  - name: interface-name
    type: virtio
    vlan: 164
```

### Network Device Properties

#### name
- **Type**: `string`
- **Description**: Network interface identifier
- **Required**: Yes
- **Example**: `name: "eth0"`

#### type
- **Type**: `string`
- **Description**: Network device type
- **Values**: `"virtio"` (high-performance, recommended)
- **Required**: Yes

#### vlan
- **Type**: `integer`
- **Description**: VLAN tag of the interface
- **Values**: `"164"` (Valid values are 0-4094)
- **Required**: No (will default to 0, which means ALL)

## Cloud-Init Integration

Cloud-init enables automated VM initialization and configuration.

### Cloud-Init Schema

```yaml
cloud_init_data:
  user_data: |
    #cloud-config
    # Your cloud-init configuration here
  meta_data: |
    instance-id: vm-001
    local-hostname: my-vm
```

### user_data
- **Type**: `string`
- **Description**: Cloud-init user data configuration
- **Format**: Multi-line YAML string starting with `#cloud-config`

### meta_data
- **Type**: `string`
- **Description**: Cloud-init metadata
- **Format**: Multi-line YAML string with instance information

**[Full Cloud-Init Reference →](cloud-init.md)**

## Complete Example

```yaml
resources:
  - type: virdomain
    name: "web-server-prod"
    spec:
      description: "Production web server with database"
      cpu: 4
      memory: "8589934592"  # 8 GB
      machine_type: "uefi"
      state: "running"
      
      storage_devices:
        - name: "os-disk"
          type: "virtio_disk"
          source: "ubuntu-image"
          boot: 1
          capacity: 53687091200  # 50 GB
        - name: "data-disk"
          type: "virtio_disk"
          capacity: 214748364800  # 200 GB
        - name: "backup-cd"
          type: "ide_cdrom"
          source: "backup-iso"
          boot: 2
      
      network_devices:
        - name: "eth0"
          type: "virtio"
        - name: "eth1"
          type: "virtio"
      
      tags:
        - "production"
        - "web-server"
        - "database"
        - "monitoring"
      
      cloud_init_data:
        user_data: |
          #cloud-config
          package_update: true
          packages:
            - nginx
            - mysql-server
          runcmd:
            - systemctl enable nginx
            - systemctl start nginx
        meta_data: |
          instance-id: web-server-prod-001
          local-hostname: web-server-prod
```

## Validation Rules

### Resource Constraints

- **CPU**: Must be positive integer
- **Memory**: Must be valid byte string (minimum 100MB)
- **Storage**: Minimum 1GB for disk devices
- **Names**: Must be unique within the manifest

### Boot Configuration

- **Boot Priority**: Must be positive integers
- **Primary Boot**: At least one device should have `boot: 1`
- **Boot Order**: Lower numbers have higher priority

### Asset References

- **Source Validation**: Referenced assets must exist in the assets section
- **Format Compatibility**: Asset format must match device type

## Best Practices

### 1. Resource Sizing

Match resources to workload requirements:

```yaml
# Web Server
cpu: 2
memory: "4294967296"      # 4 GB

# Database Server
cpu: 4
memory: "8589934592"      # 8 GB

# Development VM
cpu: 1
memory: "2147483648"      # 2 GB
```

### 2. Storage Layout

Separate OS and data storage:

```yaml
storage_devices:
  - name: "os-disk"
    type: "virtio_disk"
    source: "os-image"
    boot: 1
    capacity: 32212254720    # 30 GB
  - name: "data-disk"
    type: "virtio_disk"
    capacity: 107374182400   # 100 GB
```

### 3. Network Configuration

Use descriptive interface names:

```yaml
network_devices:
  - name: "mgmt-interface"
    type: "virtio"
  - name: "data-interface"
    type: "virtio"
```

### 4. Tagging Strategy

Use consistent tags for organization:

```yaml
tags:
  - "{{ environment }}"     # production, staging, development
  - "{{ application }}"     # web, database, cache
  - "{{ team }}"           # platform, backend, frontend
  - "{{ backup-policy }}"  # daily, weekly, none
```

## Common Patterns

### Template VM

```yaml
spec:
  state: "shutoff"
  tags: ["template", "base-image"]
```

### Multi-Boot VM

```yaml
storage_devices:
  - name: "primary-os"
    boot: 1
  - name: "secondary-os"
    boot: 2
  - name: "recovery-disk"
    boot: 3
```

### High-Performance VM

```yaml
cpu: 8
memory: "17179869184"  # 16 GB
storage_devices:
  - name: "nvme-disk"
    type: "virtio_disk"
    capacity: 214748364800  # 200 GB
```

## Troubleshooting

### Common Issues

1. **Memory format errors**: Use string format for memory values
2. **Boot failures**: Check boot order and device types
3. **Asset not found**: Verify asset names match exactly
4. **Resource conflicts**: Ensure unique names within manifest

### Debugging Tips

1. Validate boot device configuration
2. Check asset availability and formats
3. Verify memory and storage sizing
4. Review cloud-init syntax

## Related Documentation

- **[Assets Reference](assets.md)** - External resource management
- **[Cloud-Init Guide](cloud-init.md)** - VM initialization
- **[Examples](../examples/basic.md)** - Real-world configurations
- **[Best Practices](../best-practices/general.md)** - General guidelines
