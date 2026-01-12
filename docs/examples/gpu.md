# GPU Applications

This section demonstrates GPU-enabled virtual machine deployment using Fleet Manager application manifests. The example shows how to create VMs with NVIDIA GPU support, Docker, and containerized GPU workloads.

## Overview

This GPU applications provide:

- **NVIDIA GPU support** with driver installation
- **Docker container runtime** with GPU access
- **Automated GPU driver setup** via cloud-init
- **Container orchestration** for GPU workloads
- **Production-ready configurations** with systemd services

## YOLO Object Detection Application

This example deploys a complete GPU-enabled virtual machine running a YOLO object detection container.

### YOLO Object Detection Manifest

```yaml title="yolo-object-detection/manifest.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "nvidia-docker-gpu-app-{{ app_id }}"
  labels:
    - nvidia
    - docker
    - gpu
spec:
  assets:
    - name: ubuntu_gpu_base
      type: virtual_disk
      format: raw
      url: "https://storage.googleapis.com/demo-bucket-lfm/noble-server-cloudimg-amd64.img"
  
  resources:
    - type: virdomain
      name: "nvidia-docker-gpu-{{ app_id }}"
      spec:
        description: VM with Nvidia Drivers, Docker, and YOLO container
        cpu: 8
        memory: 12 GiB
        machine_type: "bios"   # GPU VMs often use BIOS
        
        storage_devices:
          - name: disk1
            type: virtio_disk
            source: "ubuntu_gpu_base"
            boot: 1
            capacity: 30 GB
        
        network_devices:
          - name: eth0
            type: virtio
        
        tags:
          - nvidia
          - docker
          - gpu-app
          - THEGPU
        
        state: running
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            package_upgrade: true
            
            packages:
              - curl
              - wget
              - apt-transport-https
              - ca-certificates
              - gnupg
              - lsb-release
              - qemu-guest-agent
              - cloud-guest-utils
              - gdisk
              - software-properties-common
              - build-essential
            
            # Resize root filesystem
            growpart:
              mode: auto
              devices: ['/']
            resizefs:
              device: /
            
            # Set root password
            chpasswd:
              list: |
                root:testpassword123
              expire: false
            
            # Create admin user with docker access
            users:
              - name: admin
                primary_group: admin
                plain_text_passwd: 'testpassword123'
                lock_passwd: false
                shell: /bin/bash
                sudo: ALL=(ALL) NOPASSWD:ALL
                ssh_import_id: ["gh:haljac"]
                groups: sudo, adm, docker
            
            # YOLO container systemd service
            write_files:
            - path: /etc/systemd/system/yolo-stream.service
              permissions: '0644'
              content: |
                [Unit]
                Description=YOLO Stream Docker Container
                Requires=docker.service
                After=network-online.target docker.service nvidia-persistenced.service

                [Service]
                Restart=always
                TimeoutStartSec=300
                ExecStartPre=-/usr/bin/docker stop yolo-stream-container
                ExecStartPre=-/usr/bin/docker rm yolo-stream-container
                ExecStartPre=/usr/bin/docker pull halja7/yolo-stream:latest
                ExecStartPre=/bin/sleep 10
                ExecStart=/usr/bin/docker run --name yolo-stream-container --gpus all -p 5050:5050 halja7/yolo-stream:latest
                ExecStop=/usr/bin/docker stop yolo-stream-container

                [Install]
                WantedBy=multi-user.target
            
            runcmd:
              # Enable qemu-guest-agent
              - systemctl enable qemu-guest-agent
              - systemctl start qemu-guest-agent
              
              # Install NVIDIA drivers
              - wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb -O /tmp/cuda-keyring.deb
              - dpkg -i /tmp/cuda-keyring.deb
              - add-apt-repository "deb https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/ /"
              - apt-get update
              - apt-get install -y cuda-drivers
              
              # Install Docker
              - apt-get install -y ca-certificates curl
              - install -m 0755 -d /etc/apt/keyrings
              - curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
              - chmod a+r /etc/apt/keyrings/docker.asc
              - echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
              - apt-get update
              - apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
              
              # Install NVIDIA Container Toolkit
              - curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
              - curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
              - apt-get update
              - apt-get install -y nvidia-container-toolkit
              
              # Configure Docker for GPU access
              - nvidia-ctk runtime configure --runtime=docker
              - systemctl restart docker
              
              # Enable services
              - systemctl enable nvidia-persistenced.service
              - systemctl enable yolo-stream.service
            
            # Reboot to load drivers
            power_state:
              mode: reboot
              message: Rebooting after Nvidia driver and Docker installation
              timeout: 120
              condition: true
          
          meta_data: |
            instance-id: nvidia-docker-gpu-{{ app_id }}
            local-hostname: nvidia-docker-gpu-{{ app_id }}
```

### Key Features

This manifest demonstrates several important GPU application patterns:

#### GPU Hardware Support
- **BIOS machine type**: Often required for GPU passthrough
- **High memory allocation**: 12 GB for GPU workloads
- **Multi-core CPU**: 8 cores for processing

#### Driver Installation
- **CUDA drivers**: Latest drivers from NVIDIA repository
- **Container toolkit**: NVIDIA Container Toolkit for Docker GPU access
- **Persistence daemon**: Ensures GPU state persistence

#### Container Orchestration
- **Systemd service**: Manages YOLO container lifecycle
- **GPU access**: `--gpus all` flag enables GPU access in container
- **Network exposure**: Port 5050 for web interface
- **Automatic restart**: Container restarts on failure

#### Security and Access
- **SSH key import**: GitHub SSH key integration
- **User management**: Admin user with sudo access
- **Password authentication**: For initial access

## Accessing the Application

After deployment, you can access the YOLO object detection service:

1. **Web Interface**: `http://vm-ip:5050`
2. **SSH Access**: `ssh admin@vm-ip` (password: `testpassword123`)
3. **GPU Status**: Check with `nvidia-smi` command
4. **Container Status**: `docker ps` to see running containers

## Configuration Options

### Resource Scaling

```yaml
# For lighter workloads
cpu: 4
memory: 8 GiB

# For heavier ML workloads  
cpu: 16
memory: 32 GiB
```

### Storage Allocation

```yaml
storage_devices:
  - name: disk1
    capacity: 30 GB   # minimal
  - name: disk1  
    capacity: 100 GB  # recommended
```

### Container Configuration

```yaml
# Custom container image
ExecStartPre=/usr/bin/docker pull your-registry/custom-gpu-app:latest
ExecStart=/usr/bin/docker run --name gpu-app --gpus all -p 8080:8080 your-registry/custom-gpu-app:latest
```

## Best Practices

### 1. GPU Requirements

- **Use BIOS machine type** for better GPU compatibility
- **Allocate sufficient memory** (8GB minimum for GPU workloads)
- **Plan storage carefully** for model downloads and data

### 2. Driver Management

- **Use official NVIDIA repositories** for driver installation
- **Install CUDA** for better performance with ML frameworks
- **Enable persistence daemon** for production stability

### 3. Container Strategy

- **Use systemd services** for container lifecycle management
- **Implement health checks** and restart policies
- **Expose necessary ports** for application access

### 4. Security Considerations

- **Change default passwords** before production deployment
- **Use SSH keys** for authentication
- **Limit network exposure** to required ports only

## Troubleshooting

### Common Issues

1. **GPU not detected**: Check machine type and GPU passthrough configuration
2. **Driver installation fails**: Verify Ubuntu version compatibility
3. **Container won't start**: Check Docker daemon and GPU runtime configuration
4. **Performance issues**: Monitor GPU utilization with `nvidia-smi`

### Debug Commands

```bash
# Check GPU status
nvidia-smi

# Check Docker GPU access
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# Check container logs
docker logs yolo-stream-container

# Check service status
systemctl status yolo-stream.service
```

## Related Examples

- **[Kubernetes GPU Cluster](kubernetes.md#gpu-cluster)** - Orchestrated GPU workloads
- **[Multi-VM Applications](multi-vm.md)** - Complex deployments with GPU VMs
- **[Linux Templates](linux.md)** - Base Linux configurations

## Next Steps

1. **Customize** the container image for your specific GPU workload
2. **Add monitoring** and logging for production deployments
3. **Scale** horizontally with multiple GPU VMs
4. **Integrate** with container orchestration platforms
