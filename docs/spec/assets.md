# Assets Specification

Assets define external resources like disk images, ISOs, and other files that your VMs can use. They provide a way to reference and manage external dependencies in your manifests.

## Structure

```yaml
spec:
  assets:
    - name: "asset-name"
      type: "virtual_disk"
      format: "raw"
      url: "https://example.com/image.img"
```

## Required Fields

### name
- **Type**: `string`
- **Description**: Unique asset identifier within the manifest
- **Constraints**: DNS-1123 compliant, lowercase, alphanumeric with hyphens

### type
- **Type**: `string`
- **Value**: `"virtual_disk"`
- **Description**: Asset type identifier.

### format (support for .qcow2, .vmdk,.vhd, .vhdx, and non-raw .img are coming in a future HyperCore version)
- **Type**: `string`
- **Values**: `"raw", "iso"`
- **Description**: Asset file format

### url
- **Type**: `string`
- **Description**: HTTPS URL to download the asset
- **Constraints**: Must be HTTPS, publicly accessible

## Asset Types

### Virtual Disk

Disk images for VM storage:

```yaml
- name: "ubuntu-image"
  type: "virtual_disk"
  format: "raw"
  url: "https://storage.googleapis.com/demo-bucket/ubuntu-22.04.img"
```

```

## Usage in Resources

Reference assets in storage devices:

```yaml
storage_devices:
  - name: "root-disk"
    type: "virtio_disk"
    source: "ubuntu-image"  # References asset name
    capacity: 53687091200
    boot: 1
```

## Best Practices

1. **Use versioned URLs** for reproducible deployments
2. **Host assets reliably** on CDNs or stable storage
3. **Optimize sizes** for faster deployment
4. **Use descriptive names** that indicate content
5. **Document asset sources** for maintainability

## Examples

### Linux Base Images

```yaml
assets:
  - name: "ubuntu-server"
    type: "virtual_disk"
    format: "raw"
    url: "https://cloud-images.ubuntu.com/releases/22.04/release/ubuntu-22.04-server-cloudimg-amd64.img"

```

### Windows Images

```yaml
assets:
  - name: "windows-server"
    type: "virtual_disk"
    format: "raw"
    url: "https://storage.example.com/windows-server-2022.img"
```
