# Kraken Applications

A collection of reference Kraken manifests that demonstrate how to provision virtual machines and applications using the Kraken infrastructure automation platform. These manifests serve as templates and examples for deploying various workloads on Scale Computing's HyperCore infrastructure.

## Overview

Kraken manifests are YAML files that define infrastructure resources and configurations for automated deployment. They follow the Kraken Application specification and are processed by the Kraken Core API to create and manage virtual machines on HyperCore clusters.

### How It Works

1. **Manifest Creation**: Define your application infrastructure using the Kraken manifest format
2. **Submission**: Submit manifests to Kraken via the Fleet Manager UI or API
3. **Processing**: The Kraken Core API validates and processes the manifest
4. **Deployment**: Resources are provisioned on target HyperCore clusters using Pulumi
5. **Management**: Monitor and manage deployed resources through the Kraken ecosystem

In production environments, manifests are typically submitted through the Fleet Manager UI's WYSIWYG editor, which delivers them to the Kraken Core API via Google Pub/Sub and the pubsub-ambassador service.

## Manifest Structure

All Kraken manifests follow this basic structure:

```yaml
type: Application
version: "1.0.0"
metadata:
  name: "my-application"
  labels:
    - "environment:production"
    - "team:platform"
spec:
  assets:
    - name: "disk-image"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.example.com/images/ubuntu.img"
  resources:
    - type: "virdomain"
      name: "my-vm"
      spec:
        description: "My virtual machine"
        cpu: 2
        memory: "4294967296"  # 4GB in bytes
        machine_type: "uefi"
        storage_devices:
          - name: "disk1"
            type: "virtio_disk"
            source: "disk-image"
            boot: 1
            capacity: 50000000000  # 50GB in bytes
        network_devices:
          - name: "eth0"
            type: "virtio"
        tags:
          - "production"
          - "web-server"
        state: "running"
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - nginx
```

### Key Components

- **type**: Always "Application" for Kraken manifests
- **version**: Manifest schema version (typically "1.0.0")
- **metadata**: Application name, labels, and other metadata
- **spec**: The main specification containing:
  - **assets**: Virtual disk images and other resources
  - **resources**: Virtual machines (VirDomain) and their configurations
  - **cloud_init_data**: Optional cloud-init configuration for VM initialization

## Reference Examples

### Basic Virtual Machines

#### [Simple VirDomain](simple-virdomain/manifest.yaml)
A minimal virtual machine configuration demonstrating basic VirDomain resource creation with:
- 2 CPUs, 100MB memory
- UEFI machine type
- IDE CDROM and VirtIO disk storage
- VirtIO network interface
- External disk image asset

#### [Linux Template](linux-template/manifest.yaml)
A Linux-based virtual machine template showing:
- Template VM in shutoff state (ready for cloning)
- 4GB memory, VirtIO disk with 50GB capacity
- Fedora-based disk image
- UEFI boot configuration

#### [Windows Template](window-template/manifest.yaml)
A Windows virtual machine template featuring:
- Windows OS configuration
- TPM machine type for Windows compatibility
- 4GB memory, 100GB VirtIO disk
- Windows Server 2022 disk image

### Multi-VM Applications

#### [Multi VirDomain Template](multi-virdomain-template/manifest.yaml)
Demonstrates deploying multiple VMs in a single manifest:
- Both Windows and Linux VMs
- Shared asset management
- Different machine types (TPM for Windows, UEFI for Linux)
- Multiple disk images in one deployment

### Cloud-Init Integration

#### [Single Node K3s](single-node-k3s/manifest.yaml)
A complete Kubernetes cluster deployment showcasing:
- Advanced cloud-init configuration
- Package installation and system configuration
- K3s installation and cluster setup
- Monitoring stack deployment (Prometheus, Grafana, Node Exporter)
- Service configuration and networking
- Root filesystem expansion

### Application Deployments

#### [YOLO Object Detection](yolo-object-detection/manifest.yaml)
A GPU-accelerated machine learning application demonstrating:
- NVIDIA GPU driver installation
- Docker and NVIDIA Container Toolkit setup
- Automated container deployment
- Service management with systemd
- Template variables for dynamic naming

### Asset Management

#### [Small ISO](small-iso/manifest.yaml)
A minimal example showing ISO asset management:
- ISO format virtual disk
- External asset URL reference
- Asset-only manifest without VMs

## Common Patterns

### Resource Sizing
Memory and capacity values are specified in bytes:
- `memory: "4294967296"` = 4GB
- `capacity: 50000000000` = 50GB

### Boot Configuration
Storage devices support boot ordering:
- `boot: 1` = Primary boot device
- `boot: 2` = Secondary boot device

### Machine Types
- `uefi`: Modern UEFI boot (Linux, modern Windows)
- `bios`: Legacy BIOS boot (older systems)
- `tpm`: TPM-enabled for Windows security features

### Network Configuration
VirtIO network devices provide optimal performance:
```yaml
network_devices:
  - name: "eth0"
    type: "virtio"
```

### Cloud-Init Integration
Use cloud-init for VM initialization:
```yaml
cloud_init_data:
  user_data: |
    #cloud-config
    package_update: true
    packages:
      - nginx
  meta_data: |
    instance-id: my-vm-001
    local-hostname: my-vm
```

## Best Practices

1. **Use descriptive names**: Make resource names clear and meaningful
2. **Tag resources**: Use tags for organization and management
3. **Optimize resource allocation**: Right-size CPU and memory for your workload
4. **Leverage cloud-init**: Use cloud-init for automated configuration
5. **Template management**: Use shutoff state for template VMs
6. **Security considerations**: Avoid hardcoded passwords in production
7. **Asset management**: Use versioned, reliable asset URLs
8. **Documentation**: Include descriptions for complex configurations

## Deployment

To deploy these manifests:

1. **Via Fleet Manager UI**: Upload or paste manifest content into the WYSIWYG editor
2. **Via API**: Submit manifests to the Kraken Core API `/v1/event` endpoint
3. **Via CLI**: Use Kraken CLI tools (if available) for automated deployment

## Troubleshooting

Common issues and solutions:

- **Invalid memory/capacity values**: Ensure values are in bytes, not human-readable formats
- **Asset URL failures**: Verify asset URLs are publicly hosted and accessible from target clusters
- **Boot failures**: Check boot order and device configuration
- **Cloud-init errors**: Validate YAML syntax in cloud-init data
- **Network connectivity**: Ensure network device types are supported

## Documentation

For comprehensive guides, API reference, and interactive examples, visit our documentation site:

**[https://jackhall.github.io/kraken-applications/](https://jackhall.github.io/kraken-applications/)**

## Contributing

When adding new examples:
1. Follow the established naming conventions
2. Include comprehensive descriptions
3. Add appropriate tags and labels
4. Test manifests before submission
5. Update this README with new examples

### Documentation Development

To contribute to the documentation site, you'll need:
- [uv](https://docs.astral.sh/uv/) for Python package management
- Basic familiarity with MkDocs

```bash
# Install dependencies and start development server
make dev

# Run quality checks
make check

# Build documentation
make build
```

## Related Documentation

- [Cloud-Init Documentation](https://cloudinit.readthedocs.io)
