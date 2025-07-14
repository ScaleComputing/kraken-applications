# GPU Applications

This section demonstrates how to deploy GPU-accelerated applications using Kraken manifests. These examples cover NVIDIA GPU setup, Docker container deployment, and machine learning workloads.

## Overview

GPU applications require specialized configuration including:

- **NVIDIA drivers** and runtime installation
- **Docker with GPU support** (NVIDIA Container Toolkit)
- **Proper VM sizing** for GPU workloads
- **Cloud-init automation** for complex setup

## YOLO Object Detection

This example deploys a GPU-accelerated YOLO object detection application using Docker containers.

### Complete Manifest

```yaml title="yolo-gpu-app.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "nvidia-docker-gpu-app-{{ app_id }}"
  labels:
    - nvidia
    - docker
    - gpu
    - machine-learning
spec:
  assets:
    - name: ubuntu_gpu_base
      type: virtual_disk
      format: raw
      url: "https://storage.googleapis.com/demo-bucket/noble-server-cloudimg-amd64.img"
  
  resources:
    - type: virdomain
      name: "nvidia-docker-gpu-{{ app_id }}"
      spec:
        description: "VM with NVIDIA Drivers, Docker, and YOLO container"
        cpu: 8
        memory: "12894967296"  # ~12 GB
        machine_type: "bios"
        
        storage_devices:
          - name: disk1
            type: virtio_disk
            source: "ubuntu_gpu_base"
            boot: 1
            capacity: 30000000000  # 30 GB
        
        network_devices:
          - name: eth0
            type: virtio
        
        tags:
          - nvidia
          - docker
          - gpu-app
          - machine-learning
        
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
            
            # Set up user accounts
            chpasswd:
              list: |
                root:securepassword123
              expire: false
            
            users:
              - name: admin
                primary_group: admin
                plain_text_passwd: 'securepassword123'
                lock_passwd: false
                shell: /bin/bash
                sudo: ALL=(ALL) NOPASSWD:ALL
                groups: sudo, adm, docker
            
            # Create systemd service for YOLO container
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
              - nvidia-ctk runtime configure --runtime=docker
              - systemctl restart docker
              
              # Enable services
              - systemctl enable nvidia-persistenced.service
              - systemctl enable yolo-stream.service
            
            # Reboot after driver installation
            power_state:
              mode: reboot
              message: "Rebooting after NVIDIA driver installation"
              timeout: 120
              condition: true
          
          meta_data: |
            instance-id: nvidia-docker-gpu-{{ app_id }}
            local-hostname: nvidia-docker-gpu-{{ app_id }}
```

### Key Components

#### Resource Allocation
- **CPU**: 8 cores for GPU workload processing
- **Memory**: ~12 GB for ML model loading
- **Storage**: 30 GB for OS, drivers, and container images

#### GPU Setup Process
1. **Driver Installation**: NVIDIA CUDA drivers via repository
2. **Docker Setup**: Docker CE with GPU support
3. **Container Runtime**: NVIDIA Container Toolkit
4. **Service Management**: Systemd service for application

#### Application Deployment
- **Container Image**: Pre-built YOLO detection service
- **GPU Access**: `--gpus all` flag for full GPU access
- **Network Exposure**: Port 5050 for web interface
- **Auto-restart**: Systemd ensures service reliability

## Machine Learning Workstation

A more general-purpose GPU workstation for ML development.

### Manifest

```yaml title="ml-workstation.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "ml-workstation-{{ user_id }}"
  labels:
    - nvidia
    - machine-learning
    - development
spec:
  assets:
    - name: ubuntu_ml_base
      type: virtual_disk
      format: raw
      url: "https://storage.googleapis.com/demo-bucket/ubuntu-22.04-ml.img"
  
  resources:
    - type: virdomain
      name: "ml-workstation-{{ user_id }}"
      spec:
        description: "GPU-enabled ML development workstation"
        cpu: 12
        memory: "34359738368"  # 32 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: os-disk
            type: virtio_disk
            source: "ubuntu_ml_base"
            boot: 1
            capacity: 107374182400  # 100 GB
          - name: data-disk
            type: virtio_disk
            capacity: 536870912000  # 500 GB
        
        network_devices:
          - name: eth0
            type: virtio
        
        tags:
          - ml-workstation
          - gpu-enabled
          - development
        
        state: running
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            
            packages:
              - python3-pip
              - python3-venv
              - git
              - vim
              - htop
              - nvidia-smi
              - jupyter-notebook
            
            # Create ML development environment
            runcmd:
              - pip3 install torch torchvision torchaudio tensorflow jupyter pandas numpy scikit-learn matplotlib seaborn
              - mkdir -p /home/ubuntu/notebooks
              - mkdir -p /home/ubuntu/datasets
              - chown -R ubuntu:ubuntu /home/ubuntu/
              
              # Mount data disk
              - mkfs.ext4 /dev/vdb
              - mount /dev/vdb /home/ubuntu/datasets
              - echo "/dev/vdb /home/ubuntu/datasets ext4 defaults 0 0" >> /etc/fstab
              
              # Start Jupyter on boot
              - systemctl enable jupyter
          
          meta_data: |
            instance-id: ml-workstation-{{ user_id }}
            local-hostname: ml-workstation-{{ user_id }}
```

## GPU Mining/Compute Node

High-performance compute node for GPU-intensive workloads.

### Manifest

```yaml title="gpu-compute-node.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "gpu-compute-{{ node_id }}"
  labels:
    - compute
    - gpu
    - high-performance
spec:
  resources:
    - type: virdomain
      name: "gpu-compute-{{ node_id }}"
      spec:
        description: "High-performance GPU compute node"
        cpu: 16
        memory: "68719476736"  # 64 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: nvme-disk
            type: virtio_disk
            capacity: 107374182400  # 100 GB SSD
            boot: 1
        
        network_devices:
          - name: eth0
            type: virtio
          - name: eth1
            type: virtio  # Additional network for cluster communication
        
        tags:
          - gpu-compute
          - high-performance
          - cluster-node
        
        state: running
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            
            packages:
              - nvidia-driver-525
              - cuda-toolkit-12-0
              - docker.io
              - docker-compose
              - monitoring-tools
            
            # Optimize for compute workloads
            runcmd:
              - nvidia-smi -pm 1  # Enable persistence mode
              - nvidia-smi -acp 0  # Disable auto-boost
              - echo "performance" > /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
              
              # Configure Docker for GPU
              - nvidia-ctk runtime configure --runtime=docker
              - systemctl restart docker
              
              # Set up monitoring
              - systemctl enable nvidia-monitoring
```

## Best Practices for GPU Applications

### 1. Resource Planning

```yaml
# Minimum GPU VM configuration
cpu: 4
memory: "8589934592"   # 8 GB
storage: 53687091200   # 50 GB

# High-performance GPU configuration
cpu: 16
memory: "68719476736"  # 64 GB
storage: 214748364800  # 200 GB
```

### 2. Driver Management

```yaml
# Use specific driver versions for stability
runcmd:
  - apt-get install -y nvidia-driver-525  # Specific version
  - apt-get install -y cuda-toolkit-12-0  # Specific CUDA version
```

### 3. Container Optimization

```yaml
# Systemd service with proper GPU access
ExecStart=/usr/bin/docker run --name app --gpus all \
  --shm-size=1g \
  --ulimit memlock=-1 \
  --ulimit stack=67108864 \
  my-gpu-app:latest
```

### 4. Monitoring and Maintenance

```yaml
# Include monitoring tools
packages:
  - nvidia-smi
  - nvtop
  - htop
  - iotop

# Enable GPU monitoring
runcmd:
  - nvidia-smi -pm 1  # Persistence mode
  - nvidia-smi -lgc 1400,1400  # Lock GPU clocks
```

## Performance Considerations

### VM Sizing Guidelines

| Workload Type | CPU Cores | Memory | Storage |
|---------------|-----------|--------|---------|
| Light ML | 4-8 | 8-16 GB | 50-100 GB |
| Heavy ML | 8-16 | 16-64 GB | 100-500 GB |
| HPC Compute | 16-32 | 32-128 GB | 100-1000 GB |

### Storage Optimization

- **NVMe/SSD**: Use fast storage for model loading
- **Separate data disk**: Keep datasets on dedicated disk
- **Adequate capacity**: Plan for model checkpoints and logs

### Network Configuration

- **High bandwidth**: Use multiple network interfaces for cluster workloads
- **Low latency**: Configure for distributed training scenarios

## Troubleshooting

### Common Issues

1. **Driver installation fails**
   - Check Ubuntu version compatibility
   - Verify secure boot settings
   - Use specific driver versions

2. **Docker GPU access denied**
   - Ensure nvidia-container-toolkit is installed
   - Verify Docker configuration
   - Check user permissions

3. **Container fails to start**
   - Verify GPU availability with `nvidia-smi`
   - Check container image compatibility
   - Review resource allocation

### Debugging Commands

```bash
# Check GPU status
nvidia-smi

# Test Docker GPU access
docker run --gpus all nvidia/cuda:11.0-base nvidia-smi

# Monitor GPU utilization
watch nvidia-smi

# Check container logs
docker logs yolo-stream-container
```

## Related Examples

- **[Kubernetes GPU Cluster](kubernetes.md#gpu-cluster)** - Orchestrated GPU workloads
- **[Multi-VM Applications](multi-vm.md)** - Distributed GPU computing
- **[Basic Examples](basic.md)** - Fundamental VM configuration

## Next Steps

1. **Scale to multi-GPU**: Deploy multiple GPU VMs
2. **Add monitoring**: Implement GPU metrics collection
3. **Optimize performance**: Fine-tune for specific workloads
4. **Implement backup**: Protect valuable ML models and data