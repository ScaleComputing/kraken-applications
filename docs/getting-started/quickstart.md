# Quick Start Guide

Get up and running with Kraken Applications in minutes! This guide will walk you through creating and deploying your first manifest.

## Prerequisites

Before you begin, ensure you have:

- [x] Access to a Scale Computing HyperCore environment
- [x] Kraken Fleet Manager UI or API access
- [x] Basic understanding of YAML syntax

## Step 1: Create Your First Application Manifest

Let's create a simple virtual machine manifest. 

1. Open the "Deployments" page of fleet.sclaecomputing.com
2. Select "Applications"
3. Add an application titled "My First VM"
4. Copy-paste the following into the manifest code editor

```yaml title="my-first-vm.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "my-first-vm"
  labels:
    - "environment:development"
    - "purpose:learning"
spec:
  resources:
    - type: virdomain
      name: "quickstart-vm"
      spec:
        description: "My first Kraken VM"
        cpu: 2
        memory: "2 GB"
        machine_type: "uefi"
        state: "running"
        storage_devices:
          - name: "main-disk"
            type: "virtio_disk"
            capacity: "20 GB"
            boot: 1
        network_devices:
          - name: "eth0"
            type: "virtio"
        tags:
          - "quickstart"
          - "tutorial"
```

### What This Manifest Does

- **Creates a VM** named "quickstart-vm"
- **Allocates resources**: 2 CPU cores, 2 GB RAM
- **Configures storage**: 20 GB VirtIO disk
- **Sets up networking**: Single VirtIO network interface
- **Starts the VM**: `state: "running"`

## Step 2: Select Your Target Clusters

1. **Open** the Deployments page in Fleet Manager
2. **Navigate** to the Cluster Groups section
3. **Click** "Create Cluster Group"
4. **Select** a desired test cluster or two
5. **Click** "Save

## Step 3: Create and run Deployment

1. **Open** the Deployments page in Fleet Manager
2. **Click** "Add Deployment"
3. **Name** your deployment
3. **Select** the cluster group you created
4. **Attach** the application you created
5. **Click** "Save
6. **Click** Deploy to send your application(s) to the cluster(s) in your cluster group

## Step 4: Monitor Deployment

1. **Check** the Deployments dashboard
2. **Monitor** deployment progress
3. **View** resource status and logs

## Step 5: Verify Your VM

Once deployed, verify your VM is running:

1. **Check HyperCore console** for the new VM
2. **Verify resource allocation** matches your manifest
3. **Test network connectivity** if needed

## Step 6: Next Steps

Now that you have a basic VM running, try these updates. 

To make updates to deployed VMs:

1. Open the application record
2. Edit the manifest
3. Save the application
4. Reurn to the deployment record that references the application
5. Deploy and watch the updated manifest apply!

**Note**: the update process will typically power down the VM, make changes, and restore the VM running state to the desired setting.

**Warning**: Updating the name will _create a new_ VM. Updating the VM name is currently not supported.

### Add an External Disk Image
Non-ISO (raw .img)
```yaml
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
        # ... other configuration
        storage_devices:
          - name: "os-disk"
            type: "virtio_disk"
            source: "ubuntu-image"  # Reference the asset
            boot: 1
            capacity: "30 GB"
```
ISO (note different assets.format, storage_devices.type, and the separation of boot ISO ide_cdrom and the virtio_disk for VM storage)
```yaml
spec:
  assets:
    - name: "ubuntu-image"
      type: "virtual_disk"
      format: "iso"
      url: "https://storage.googleapis.com/demo-bucket/ubuntu-22.04.img"
  resources:
    - type: virdomain
      name: "ubuntu-vm"
      spec:
        # ... other configuration
        storage_devices:
          - name: "os-cdrom"
            type: "ide_cdrom"
            source: "ubuntu-image"  # Reference the asset
            boot: 1
          - name: "ubuntu-storage"
            type: "virtio_disk"
            capacity: "100 GB"
```

### Add Cloud-Init Configuration

```yaml
spec:
  resources:
    - type: virdomain
      spec:
        # ... other configuration
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - nginx
              - htop
            runcmd:
              - systemctl enable nginx
              - systemctl start nginx
          meta_data: |
            instance-id: quickstart-vm-001
            local-hostname: quickstart-vm
```

### Scale Your Resources

```yaml
spec:
  resources:
    - type: virdomain
      spec:
        cpu: 4                    # Double the CPU
        memory: "4294967296"      # Double the RAM (4 GB)
        storage_devices:
          - name: "main-disk"
            type: "virtio_disk"
            capacity: 53687091200  # Increase to 50 GB
            boot: 1
```

## Common Patterns

### Development VM

Perfect for testing and development:

```yaml
cpu: 2
memory: "2147483648"      # 2 GB
capacity: 32212254720     # 30 GB
state: "running"
tags: ["development", "testing"]
```

### Template VM

Create a template for cloning:

```yaml
cpu: 2
memory: "4294967296"      # 4 GB
capacity: 32212254720     # 30 GB
state: "shutoff"          # Template state
tags: ["template", "base-image"]
```

### Production VM

Production-ready configuration:

```yaml
cpu: 4
memory: "8589934592"      # 8 GB
capacity: 107374182400    # 100 GB
state: "running"
tags: ["production", "monitored"]
```

## Troubleshooting

### Common Issues

#### 1. Deployment Fails

**Symptom**: Manifest fails to deploy

**Solutions**:
- Check YAML syntax
- Verify resource availability
- Ensure unique names
- Check asset URLs

#### 2. VM Won't Start

**Symptom**: VM remains in "shutoff" state

**Solutions**:
- Verify `state: "running"` is set
- Check resource constraints
- Review boot device configuration
- Check HyperCore cluster capacity

#### 3. Network Issues

**Symptom**: VM has no network connectivity

**Solutions**:
- Verify network device configuration
- Check VirtIO driver support
- Validate network settings in HyperCore

### Getting Help

If you encounter issues:

1. **Check the logs** in Fleet Manager UI
2. **Browse** [Examples](../examples/basic.md) for similar configurations
3. **Open an issue** on [GitHub](https://github.com/scalecomputing/kraken-applications/issues)

## What's Next?

Now that you've deployed your first VM, explore these advanced topics:

### 📚 Learn More

- **[Manifest Specification](../spec/overview.md)** - Complete reference
- **[Examples](../examples/basic.md)** - Real-world use cases
- **[Best Practices](../best-practices/general.md)** - Optimization tips

### 🚀 Try Advanced Features

- **[Multi-VM Applications](../examples/multi-vm.md)** - Deploy multiple VMs
- **[Kubernetes Deployment](../examples/kubernetes.md)** - Container orchestration
- **[GPU Applications](../examples/gpu.md)** - Machine learning workloads

### 🔧 Optimize Your Deployments

- **[Cloud-Init Guide](../spec/cloud-init.md)** - Automated configuration

## Summary

Congratulations! You've successfully:

- ✅ Created your first Kraken manifest
- ✅ Deployed a virtual machine
- ✅ Learned basic troubleshooting
- ✅ Explored next steps

You're now ready to build more complex applications with Kraken. Happy deploying! 🎉
