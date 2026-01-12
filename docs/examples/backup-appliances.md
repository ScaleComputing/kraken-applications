# Backup Appliances

This section demonstrates deployment of Virtual Backup Appliances using Fleet Manager manifests. Any backup solution can be implemented using in-guest agents, but these "agentless" solutions are significantly simpler to setup and maintain. Note that a separate license is requird to leverage the Acronis and Veeam backup solutions.  

Contact your Acronis, Veeam, or Scale Computing sales rep for more information.

## Examples

### Acronis

This example deploys a Acronis Virtual Backup Appliance, which can then be quickly configured following the instructions in the links below. You should be familiar with the official Acronis installation instructions nad make adjustments as necessary, such as updating to the latest self-hosted agent image. https://www.acronis.com/en/support/documentation/CyberProtectionService/index.html#installing-software.html

User Community Link: https://community.scalecomputing.com/s/article/SC-Services-Acronis-Backup-Quickstart-Guide  

Partner Portal Link: https://partners.scalecomputing.com/English/VAR_Scale/sfdc_knowledge/knowledge_detail.aspx?id=000005835

```
type: Application
version: "1.0.0"
metadata:
  name: "ScaleApplianceAcr"
  labels:
    - "type:appliance"
    - "os:linux"
spec:
  assets:
    - name: "ScaleAcronisAppliance"
      type: "virtual_disk"
      format: "raw"
      url: "https://pm-westfield.s3.us-east-2.amazonaws.com/ScaleAppliance.img" # Download your own latest image from Acronis, convert to raw use QEMU-IMG, and host in your preferred publicly accessible hosting service.

  resources:
    - type: "virdomain"
      name: "Scale-Acronis-Appliance"
      spec:
        description: "Acronis appliance for Scale Computing"
        cpu: 4
        memory: "8 GiB"
        machine_type: "bios"

        storage_devices:
          - name: "ScaleAcronisAppliance"
            type: "virtio_disk"
            source: "ScaleAcronisAppliance"
            boot: 1
            capacity: "100 GB"

        network_devices:
          - name: "eth0"
            type: "virtio"

        tags:
          - "acronis"
          - "linux"

        state: "running"  
```

### Veeam

This example deploys a Veeam Virtual Backup Appliance, which can then be quickly configured following the instructions in the links below. We recommend being familiar with the official Veeam installation instructions nad making adjustments as necessary, such as updating to a latest self-hosted agent image. https://helpcenter.veeam.com/docs/vpsch/userguide/overview.html?ver=2

User Community Link: https://community.scalecomputing.com/s/article/Download-Links-for-Veeam-SC-HyperCore-Plug-in-1-0  

Partner Portal Link: https://partners.scalecomputing.com/English/VAR_Scale/sfdc_knowledge/knowledge_detail.aspx?id=000006504

```
type: Application
version: "1.0.0"
metadata:
  name: "Veeam-Appliance"
  labels:
    - "type:appliance"
    - "os:linux"
spec:
  assets:
    - name: "veeam-iso"
      type: "virtual_disk"
      format: "iso"
      url: "https://storage.googleapis.com/demo-bucket-lfm/VeeamDataPlatformPremium_v12.3.2_20250716.iso" # download your own latest ISO from Veeam, and host in your preferred publicly accessible file host.

  resources:
    - type: "virdomain"
      name: "VeeamAppliance"
      spec:
        description: "Veeam virtual appliance"
        cpu: 8
        memory: 8 GiB
        machine_type: "uefi"

        storage_devices:
          - name: "veeam-iso"
            type: "ide_cdrom"
            boot: 1
          - name: "disk1"
            type: "virtio_disk"
            capacity: 480 GB
          - name: "disk2"
            type: "virtio_disk"
            capacity: 480 GB

        network_devices:
          - name: "eth0"
            type: "virtio"

        tags:
          - "veeam"
          - "linux"

        state: "running"
```

## Accessing the Application

After deployment, got to each VM console and complete the initial configuration for each specific cluster.
It is possible to add cloud-init to your manifest to complete some or all of the intiial configuration, depending on your specific environment and needs.
Additional configuration will be necessary in the respective Backup vendors cloud console for backups to successfully begin.

## Configuration Options

### Resource Scaling

```yaml
# For fewer concurrent backup jobs
cpu: 4
memory: 4 GiB

# For more concurrent backup jobs
cpu: 16
memory: 16 GiB
```

## Best Practices

### 1. Self-host images

- Publicly hosted images may disappear or change without warning
- Personally hosting ensures consistency and security

### 2. Fine-tune resource usage

- Spread backup schedules to reduce the number of concurrent jobs at any one time
- Check VM resource utilization during peak backups, adding or reducing resources as needed

### 3. Create an SOP for backup configuration

- Document your specific confguration to improve the speed and quality of setting up multiple backups
- Once steps are documented, they can potentially be automated using cloud-init.


## Troubleshooting

### Common Issues

1. **Cluster is offline**: Verify the cluster youa re deploying to is online.
2. **Cluster lacks free resources to power on VM**: Power off other workloads, add a node, or consider reducing the resources of the deployed VM.
3. **VM created but doesn't find bootable media**: Verify your media is downloadable and bootable from your personal machine

## Related Examples

- **[Kubernetes GPU Cluster](kubernetes.md#gpu-cluster)** - Orchestrated GPU workloads
- **[Multi-VM Applications](multi-vm.md)** - Complex deployments with GPU VMs
- **[Linux Templates](linux.md)** - Base Linux configurations
