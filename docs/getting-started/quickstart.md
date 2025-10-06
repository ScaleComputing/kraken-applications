# Quick Start Guide

Get up and running with Kraken Applications in minutes! This guide will walk you through creating and deploying your first manifest.

## Prerequisites

Before you begin, ensure you have:

- [x] Access to a Scale Computing HyperCore environment
- [x] Kraken Fleet Manager UI or API access
- [x] Basic understanding of YAML syntax

## Step 1: Your First Manifest

Let's create a simple virtual machine manifest. Create a file called `my-first-vm.yaml`:

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
        memory: "2147483648"  # 2 GB
        machine_type: "uefi"
        state: "running"
        storage_devices:
          - name: "main-disk"
            type: "virtio_disk"
            capacity: 21474836480  # 20 GB
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

## Step 2: Deploy Your Manifest

1. **Log in** to your Fleet Manager UI
2. **Navigate** to the Applications section
3. **Click** "Create Application"
4. **Paste** your manifest into the editor
5. **Click** "Deploy"

## Step 3: Monitor Deployment


1. **Check** the Deployments dashboard
2. **Monitor** deployment progress
3. **View** resource status and logs


## Step 4: Verify Your VM

Once deployed, verify your VM is running:

1. **Check HyperCore console** for the new VM
2. **Verify resource allocation** matches your manifest
3. **Test network connectivity** if needed

## Step 5: Next Steps

Now that you have a basic VM running, try these updates. 

To make updates to deployed VMs:
1. Open the application record
2. Edit the manifest
3. Save
4. Open or Create a deployment record that references the application
5. Deploy and watch the updated manifest apply!

**Note**: the update process will typically power down the VM, make changes, and restore the VM running state to the desired setting.

**Warning**: Updating the name will _create a new_ VM. Updating the VM name is currently not supported.

### Add an External Disk Image

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
            capacity: 32212254720  # 30 GB
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
