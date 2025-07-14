# Basic Examples

This section provides fundamental examples of Kraken manifests based on actual examples from this repository. Each example demonstrates core concepts and patterns used in real deployments.

## Simple Virtual Machine

The most basic Kraken manifest creates a single virtual machine. This example is based on the `simple-virdomain/manifest.yaml` in this repository.

### Simple VirDomain Manifest

```yaml title="simple-virdomain/manifest.yaml"
version: 1
type: Application
metadata:
  name: simple-virdomain
spec:
  assets:
    - name: test-disk
      type: virtual_disk
      format: raw
      url: https://storage.googleapis.com/demo-bucket-lfm/netboot.xyz.img
  
  resources:
    - name:  # Empty name will be auto-generated
      type: virdomain
      spec:
        description: A simple VM for testing
        cpu: 2
        memory: 100000000  # ~95 MB
        machine_type: uefi
        
        storage_devices:
          - name: cdrom1
            type: ide_cdrom
            boot: 1
          - name: disk1
            source: test-disk
            boot: 2
          - name: disk2
            type: virtio_disk
            capacity: 100000000000  # ~93 GB
        
        network_devices:
          - name: nic1
            type: virtio
        
        tags:
          - kraken
          - test
        
        state: running
```

### Key Features

This simple manifest demonstrates:

#### Asset Management
- **External disk image**: Uses netboot.xyz image from Google Cloud Storage
- **Asset reference**: Storage device references the asset by name

#### Multiple Storage Devices
- **IDE CD-ROM**: Primary boot device (boot: 1)
- **Asset disk**: Secondary boot from the netboot.xyz image (boot: 2)  
- **VirtIO disk**: Large capacity disk for data storage

#### Basic Configuration
- **CPU**: 2 virtual cores
- **Memory**: ~95 MB (minimal allocation)
- **Network**: Single VirtIO network interface
- **Machine type**: UEFI for modern boot support

## Asset-Only Example

Sometimes you only need to define assets without creating VMs immediately. This example is based on `small-iso/manifest.yaml`.

### ISO Asset Manifest

```yaml title="small-iso/manifest.yaml"
version: "1"
type: Application
metadata:
  name: just-an-iso-demo
spec:
  assets:
    - name: test-disk
      type: virtual_disk
      format: iso
      url: http://vm-stor2.lab.local/Public/large-file-manager/alpine-virt-3.21.2-x86_64.iso
```

### Use Case

This pattern is useful for:
- **Preparing assets** for later VM creation
- **Sharing common assets** across multiple applications
- **Testing asset availability** before deployment

## Template VMs

Template VMs are created in `shutoff` state for cloning. This example is based on `linux-template/manifest.yaml`.

### Linux Template Manifest

```yaml title="linux-template/manifest.yaml"
version: "1"
type: Application
metadata:
  name: linux-template-demo
  labels:
    - admin:Scale2025
spec:
  assets:
    - name: fedora_disk
      type: virtual_disk
      format: raw
      url: http://vm-stor2.lab.local/Public/large-file-manager/linux_template.img
  
  resources:
    - type: virdomain
      name: linux-template-demo
      spec:
        description: Linux template
        cpu: 0  # Templates often use 0 CPU
        memory: "4294967296"  # 4 GB
        machine_type: uefi
        
        storage_devices:
          - name: disk2
            type: virtio_disk
            capacity: 50000000000  # 50 GB
            source: "fedora_disk"
            boot: 1
        
        network_devices:
          - name: eth0
            type: virtio
        
        tags:
          - template
          - fedora
          - linux
        
        state: shutoff  # Template state for cloning
```

### Template Best Practices

#### Resource Allocation
- **CPU: 0**: Template VMs often use 0 CPU since they don't run
- **Adequate memory**: 4 GB provides good base for most workloads
- **Standard storage**: 50 GB accommodates OS and applications

#### State Management
- **shutoff state**: Templates should be stopped for cloning
- **Descriptive tags**: Help identify and categorize templates
- **Clear naming**: Include "template" in name and tags

## Windows Template

Windows VMs require different configuration. This example is based on `window-template/manifest.yaml`.

### Windows Template Manifest

```yaml title="window-template/manifest.yaml"
version: "1"
type: Application
metadata:
  name: window-template-demo
  labels:
    - Administrator:Scale2025
spec:
  assets:
    - name: window_disk
      type: virtual_disk
      format: raw
      url: http://vm-stor2.lab.local/Public/large-file-manager/win22_server.img
  
  resources:
    - type: virdomain
      name: window-template-demo
      spec:
        description: Window Template
        os: windows  # OS type specification
        cpu: 0
        memory: "4294967296"  # 4 GB
        machine_type: tpm  # TPM required for Windows
        
        storage_devices:
          - name: disk1
            type: virtio_disk
            source: "window_disk"
            boot: 1
            capacity: 100000000000  # 100 GB
        
        network_devices:
          - name: eth0
            type: virtio
        
        tags:
          - template
          - window
        
        state: shutoff
```

### Windows-Specific Configuration

#### Machine Type
- **TPM machine type**: Required for Windows security features
- **Larger storage**: 100 GB accommodates Windows OS requirements

#### Labels and Tags
- **Administrator labels**: Windows-specific administrative metadata
- **OS specification**: Explicit `os: windows` field

## Multi-VM Application

Deploy multiple VMs in a single manifest. This example is based on `multi-virdomain-template/manifest.yaml`.

### Multi-VirDomain Manifest

```yaml title="multi-virdomain-template/manifest.yaml"
version: "1"
type: Application
metadata:
  name: multi-virdomain-template-demo
  labels:
    - Administrator:Scale2025
    - admin:Scale2025
spec:
  assets:
    - name: fedora_disk
      type: virtual_disk
      format: raw
      url: http://vm-stor2.lab.local/Public/large-file-manager/linux_template.img
    - name: window_disk
      type: virtual_disk
      format: raw
      url: http://vm-stor2.lab.local/Public/large-file-manager/win22_server.img
  
  resources:
    # Windows VM
    - type: virdomain
      name: window-template-demo
      spec:
        description: Window Template
        os: windows
        cpu: 0
        memory: "4294967296"
        machine_type: tmp
        storage_devices:
          - name: disk1
            type: virtio_disk
            source: "window_disk"
            boot: 1
            capacity: 100000000000  # 100 GB
        network_devices:
          - name: eth0
            type: virtio
        tags:
          - template
          - window
        state: shutoff
    
    # Linux VM
    - type: virdomain
      name: linux-template-demo
      spec:
        description: Linux template
        cpu: 0
        memory: "4294967296"  # 4 GB
        machine_type: uefi
        storage_devices:
          - name: disk2
            type: virtio_disk
            capacity: 50000000000  # 50 GB
            source: "fedora_disk"
            boot: 1
        network_devices:
          - name: eth0
            type: virtio
        tags:
          - template
          - fedora
          - linux
        state: shutoff
```

### Multi-VM Patterns

#### Shared Assets
- **Asset reuse**: Both VMs can reference the same assets
- **Efficient storage**: Common base images shared across VMs

#### Mixed Operating Systems
- **Different machine types**: TPM for Windows, UEFI for Linux
- **OS-specific configuration**: Memory and storage optimized per OS
- **Consistent networking**: Same network device patterns

## Common Configuration Patterns

### Memory Specification

```yaml
# Always use string format for memory
memory: "4294967296"  # 4 GB
memory: "8589934592"  # 8 GB
memory: "100000000"   # ~95 MB (minimal)
```

### Storage Device Types

```yaml
storage_devices:
  - name: cdrom1
    type: ide_cdrom     # For CD/DVD images
  - name: disk1
    type: virtio_disk   # High-performance disk
    source: asset_name  # Reference to asset
    boot: 1            # Boot priority
    capacity: 50000000000  # Size in bytes
```

### Network Configuration

```yaml
network_devices:
  - name: eth0
    type: virtio  # High-performance network
  - name: nic1
    type: virtio  # Alternative naming
```

### Machine Types

```yaml
machine_type: uefi    # Modern Linux systems
machine_type: tpm     # Windows with security features
machine_type: bios    # Legacy systems or GPU VMs
```

## Best Practices from Examples

### 1. Version Specification
- Use `version: "1"` or `version: 1` consistently
- Some examples use `version: "1.0.0"` for semantic versioning

### 2. Asset Management
- **Descriptive names**: Use clear asset names like `fedora_disk`, `window_disk`
- **Appropriate formats**: `raw` for disk images, `iso` for installation media
- **Reliable URLs**: Use stable storage locations

### 3. Resource Naming
- **Unique names**: Each VM needs a unique name within the manifest
- **Descriptive**: Include purpose and type (e.g., `linux-template-demo`)
- **Consistent**: Follow naming conventions across your organization

### 4. State Management
- **Templates**: Use `state: shutoff` for VMs intended for cloning
- **Active VMs**: Use `state: running` for operational workloads
- **CPU allocation**: Templates can use `cpu: 0`

## Related Examples

- **[Linux Templates](linux.md)** - Linux-specific configurations
- **[Windows Templates](windows.md)** - Windows-specific configurations  
- **[Multi-VM Applications](multi-vm.md)** - Complex multi-tier applications
- **[Kubernetes](kubernetes.md)** - Container orchestration deployments

## Next Steps

1. **Choose a base example** that matches your use case
2. **Customize resource allocation** based on your requirements
3. **Update asset URLs** to point to your images
4. **Test deployment** in a development environment
5. **Create templates** for common configurations