# Basic Examples

This section provides fundamental examples of Kraken manifests, starting with simple configurations and building up to more complex deployments. Each example includes explanations, best practices, and common variations.

## Simple Virtual Machine

The most basic Kraken manifest creates a single virtual machine with minimal configuration.

### Example: Basic VM

```yaml title="simple-vm.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "simple-vm"
  labels:
    - "environment:development"
    - "purpose:testing"
spec:
  resources:
    - type: virdomain
      name: "test-vm"
      spec:
        description: "A simple test virtual machine"
        cpu: 2
        memory: "2147483648"  # 2 GB
        machine_type: "uefi"
        state: "running"
        storage_devices:
          - name: "disk1"
            type: "virtio_disk"
            capacity: 21474836480  # 20 GB
        network_devices:
          - name: "eth0"
            type: "virtio"
        tags:
          - "test"
          - "development"
```

### Key Components

- **CPU**: 2 virtual cores
- **Memory**: 2 GB RAM
- **Storage**: 20 GB VirtIO disk
- **Network**: Single VirtIO network interface
- **Boot**: UEFI machine type for modern OS support

## VM with External Asset

This example shows how to use external disk images as VM boot sources.

### Example: VM with Asset

```yaml title="vm-with-asset.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "vm-with-external-disk"
spec:
  assets:
    - name: "ubuntu-image"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/ubuntu-22.04.img"
  resources:
    - type: virdomain
      name: "ubuntu-vm"
      spec:
        description: "Ubuntu VM using external disk image"
        cpu: 2
        memory: "4294967296"  # 4 GB
        machine_type: "uefi"
        storage_devices:
          - name: "root-disk"
            type: "virtio_disk"
            source: "ubuntu-image"  # Reference to asset
            boot: 1
            capacity: 32212254720  # 30 GB
        network_devices:
          - name: "eth0"
            type: "virtio"
        state: "running"
```

### Asset Management

- **External URL**: Points to publicly accessible disk image
- **Format**: Supports raw, qcow2, and other formats
- **Source Reference**: Links storage device to asset by name
- **Boot Priority**: `boot: 1` makes this the primary boot device

## Multi-Disk Configuration

VMs can have multiple storage devices for different purposes.

### Example: Multi-Disk VM

```yaml title="multi-disk-vm.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "multi-disk-vm"
spec:
  assets:
    - name: "os-image"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/centos-9.img"
    - name: "setup-iso"
      type: "virtual_disk"
      format: "iso"
      url: "https://storage.googleapis.com/demo-bucket/setup.iso"
  resources:
    - type: virdomain
      name: "database-server"
      spec:
        description: "Database server with multiple disks"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "uefi"
        storage_devices:
          - name: "os-disk"
            type: "virtio_disk"
            source: "os-image"
            boot: 1
            capacity: 53687091200  # 50 GB
          - name: "data-disk"
            type: "virtio_disk"
            capacity: 214748364800  # 200 GB
            boot: 0
          - name: "setup-cdrom"
            type: "ide_cdrom"
            source: "setup-iso"
            boot: 2
        network_devices:
          - name: "eth0"
            type: "virtio"
        tags:
          - "database"
          - "production"
        state: "running"
```

### Storage Configuration

- **OS Disk**: Primary boot disk from external image
- **Data Disk**: Additional storage without external source
- **CDROM**: ISO image for setup or tools
- **Boot Order**: Numbered priority (1=primary, 2=secondary, etc.)

## Template VM

Templates are VMs in "shutoff" state, ready for cloning.

### Example: Template VM

```yaml title="template-vm.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "ubuntu-template"
  labels:
    - "type:template"
    - "os:ubuntu"
spec:
  assets:
    - name: "ubuntu-base"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/ubuntu-22.04-base.img"
  resources:
    - type: virdomain
      name: "ubuntu-template"
      spec:
        description: "Ubuntu 22.04 template for cloning"
        cpu: 2
        memory: "4294967296"  # 4 GB
        machine_type: "uefi"
        storage_devices:
          - name: "template-disk"
            type: "virtio_disk"
            source: "ubuntu-base"
            boot: 1
            capacity: 32212254720  # 30 GB
        network_devices:
          - name: "eth0"
            type: "virtio"
        tags:
          - "template"
          - "ubuntu"
          - "base-image"
        state: "shutoff"  # Template state
```

### Template Benefits

- **Rapid Deployment**: Clone instead of full OS installation
- **Consistency**: All instances use same base configuration
- **Efficiency**: Reduced deployment time and network usage
- **Standardization**: Common base for team deployments

## Dynamic Naming

Use template variables for dynamic resource naming.

### Example: Dynamic Names

```yaml title="dynamic-vm.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "web-server-{{ app_id }}"
  labels:
    - "instance:{{ app_id }}"
    - "environment:{{ env }}"
spec:
  resources:
    - type: virdomain
      name: "web-{{ app_id }}"
      spec:
        description: "Web server instance {{ app_id }}"
        cpu: 2
        memory: "4294967296"
        machine_type: "uefi"
        storage_devices:
          - name: "web-disk-{{ app_id }}"
            type: "virtio_disk"
            capacity: 42949672960  # 40 GB
        network_devices:
          - name: "eth0"
            type: "virtio"
        tags:
          - "web-server"
          - "instance-{{ app_id }}"
        state: "running"
```

### Template Variables

- **{{ app_id }}**: Unique instance identifier
- **{{ env }}**: Environment name (dev, staging, prod)
- **{{ team }}**: Team or project identifier
- **{{ region }}**: Deployment region

## Resource Sizing Guide

### Small VM (Development)

```yaml
cpu: 1
memory: "1073741824"      # 1 GB
capacity: 21474836480     # 20 GB
```

### Medium VM (Testing)

```yaml
cpu: 2
memory: "4294967296"      # 4 GB
capacity: 53687091200     # 50 GB
```

### Large VM (Production)

```yaml
cpu: 4
memory: "8589934592"      # 8 GB
capacity: 107374182400    # 100 GB
```

### Extra Large VM (Database)

```yaml
cpu: 8
memory: "17179869184"     # 16 GB
capacity: 214748364800    # 200 GB
```

## Common Patterns

### 1. Development VM

```yaml
cpu: 2
memory: "2147483648"      # 2 GB
state: "running"
tags: ["development", "temporary"]
```

### 2. Production VM

```yaml
cpu: 4
memory: "8589934592"      # 8 GB
state: "running"
tags: ["production", "monitored", "backup"]
```

### 3. Template VM

```yaml
cpu: 2
memory: "4294967296"      # 4 GB
state: "shutoff"
tags: ["template", "base-image"]
```

## Best Practices

### 1. Resource Naming

- Use descriptive names that indicate purpose
- Include environment in names for clarity
- Use consistent naming conventions

### 2. Memory Allocation

- Always specify memory in bytes as strings
- Plan for OS overhead (reserve ~10% extra)
- Consider application memory requirements

### 3. Storage Planning

- Size boot disks appropriately for OS and applications
- Use separate disks for data when possible
- Consider backup and snapshot requirements

### 4. Network Configuration

- Use VirtIO for better performance
- Plan IP addressing strategy
- Consider security group requirements

## Troubleshooting

### Common Issues

1. **Memory format errors**: Use string format for memory values
2. **Boot failures**: Check boot order and device configuration
3. **Asset access failures**: Verify URL accessibility
4. **Resource conflicts**: Ensure unique names within manifest

### Validation Tips

- Test manifests in development first
- Use schema validation tools
- Check asset URLs independently
- Monitor deployment logs

## Next Steps

- **[Linux Templates](linux.md)** - Linux-specific configurations
- **[Windows Templates](windows.md)** - Windows VM examples
- **[Multi-VM Applications](multi-vm.md)** - Complex deployments
- **[Cloud-Init Guide](../spec/cloud-init.md)** - VM initialization