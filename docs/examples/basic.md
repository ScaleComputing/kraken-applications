# Basic Examples

This section provides fundamental examples of Fleet Manager Application manifests based on actual examples from this repository. Each example demonstrates core concepts and patterns used in real deployments.

## Simple Virtual Machine

The most basic application manifest creates a single virtual machine. This example is based on the `simple-virdomain/manifest.yaml` in this repository.

### Simple VirDomain Manifest

```yaml title="simple-virdomain/manifest.yaml"
version: "1"
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
    - name: simple-virdomain # Name cannot contain spaces
      type: virdomain
      spec:
        description: A simple VM for testing
        cpu: 2
        memory: 100 MiB
        machine_type: uefi
        
        storage_devices:
          - name: cdrom1
            type: ide_cdrom
          - name: disk1
            source: test-disk
            boot: 1
          - name: disk2
            type: virtio_disk
            capacity: 100 GB
        
        network_devices:
          - name: nic1
            type: virtio
        
        tags:
          - test
        
        state: running
```

### Key Features

This simple manifest demonstrates:

#### Asset Management
- **External disk image**: Uses netboot.xyz image from Google Cloud Storage
- **Asset reference**: Storage device references the asset by name

#### Multiple Storage Devices
- **IDE CD-ROM**: Attached for optionality
- **Asset disk**: Primary boot from the netboot.xyz image (boot: 1)  
- **VirtIO disk**: Large capacity disk for data storage

#### Basic Configuration
- **CPU**: 2 virtual cores
- **Memory**: 100 MiB (minimal allocation)
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
      url: https://releases.ubuntu.com/noble/ubuntu-24.04.3-desktop-amd64.iso
```

### Use Case

This pattern is useful for:
- **Preparing assets** for later VM creation
- **Sharing common assets** across multiple applications
- **Testing asset availability** before deployment


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
- **[GPU](gpu.md)** - GPU-leveraging applications

## Next Steps

1. **Choose a base example** that matches your use case
2. **Customize resource allocation** based on your requirements
3. **Update asset URLs** to point to your images
4. **Test deployment** in a development environment
5. **Create templates** for common configurations
