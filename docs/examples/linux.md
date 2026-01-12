# Linux Templates

This section demonstrates Linux-based virtual machine templates and configurations using Fleet Manager application manifests. These examples show how to create, configure, and deploy Linux VMs for various use cases.

## Overview

These Linux templates provide:

- **Base images** for rapid VM deployment
- **Template VMs** in shutoff state for cloning
- **Cloud-init integration** for automated setup
- **Package management** and service configuration
- **Multi-distribution support** (Ubuntu, CentOS, Fedora)

## Linux Template VM

This example creates a Linux template VM that can be cloned for production use.

### Template Configuration

```yaml title="linux-template.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "linux-template"
  labels:
    - "type:template"
    - "os:linux"
    - "distro:fedora"
spec:
  assets:
    - name: "fedora-base"
      type: "virtual_disk"
      format: "raw"
      url: "https://your-fedora-base-image-url.img"
  
  resources:
    - type: "virdomain"
      name: "linux-template"
      spec:
        description: "Fedora-based Linux template for cloning"
        cpu: 2
        memory: "4 GiB"
        machine_type: "uefi"
        
        storage_devices:
          - name: "template-disk"
            type: "virtio_disk"
            source: "fedora-base"
            boot: 1
            capacity: "50 GB"
        
        network_devices:
          - name: "eth0"
            type: "virtio"
        
        tags:
          - "template"
          - "linux"
          - "fedora"
        
        state: "shutoff"  # Template state for cloning
```

### Key Features

- **Template State**: `shutoff` state makes it ready for cloning
- **UEFI Boot**: Modern boot system for Linux
- **VirtIO Devices**: High-performance storage and network
- **Fedora Base**: Enterprise-ready Linux distribution
- **50GB Storage**: Adequate space for OS and applications

## Ubuntu Server

Production-ready Ubuntu server configuration with cloud-init.

### Ubuntu Server Manifest

```yaml title="ubuntu-server.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "ubuntu-server"
  labels:
    - "os:ubuntu"
spec:
  assets:
    - name: "ubuntu-server"
      type: "virtual_disk"
      format: "raw"
      url: "https://cloud-images.ubuntu.com/releases/22.04/release/ubuntu-22.04-server-cloudimg-amd64.img"
  
  resources:
    - type: "virdomain"
      name: "ubuntu-server"
      spec:
        description: "Ubuntu 22.04 LTS server"
        cpu: 2
        memory: "4 GiB"
        machine_type: "uefi"
        
        storage_devices:
          - name: "root-disk"
            type: "virtio_disk"
            source: "ubuntu-server"
            boot: 1
            capacity: "40 GB"
        
        network_devices:
          - name: "eth0"
            type: "virtio"
        
        tags:
          - "ubuntu"
          - "server"
          - "production"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            package_upgrade: true
            
            packages:
              - htop
              - curl
              - wget
              - git
              - unzip
              - software-properties-common
              - apt-transport-https
              - ca-certificates
              - gnupg
              - lsb-release
            
            # Create admin user
            users:
              - name: admin
                primary_group: admin
                shell: /bin/bash
                sudo: ALL=(ALL) NOPASSWD:ALL
                groups: sudo, adm
                lock_passwd: false
                ssh_authorized_keys:
                  - ssh-rsa AAAAB3NzaC1yc2E... # Add your SSH key
            
            # Basic security setup
            runcmd:
              - ufw --force enable
              - ufw default deny incoming
              - ufw default allow outgoing
              - ufw allow ssh
              - systemctl enable ssh
              - systemctl start ssh
          
          meta_data: |
            instance-id: ubuntu-server
            local-hostname: ubuntu-server
```

## CentOS Stream

Enterprise Linux configuration with Red Hat ecosystem tools.

### CentOS Stream Manifest (Note: QCOW2 support is coming in a later HyperCore release. For now, swap in an ISO or rw format centos image)

```yaml title="centos-stream.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "centos-stream"
  labels:
    - "os:centos"
    - "type:enterprise"
spec:
  assets:
    - name: "centos-stream"
      type: "virtual_disk"
      format: "qcow2"
      url: "https://cloud.centos.org/centos/9-stream/x86_64/images/CentOS-Stream-GenericCloud-9-latest.x86_64.qcow2"
  
  resources:
    - type: "virdomain"
      name: "centos-stream"
      spec:
        description: "CentOS Stream 9 enterprise server"
        cpu: 4
        memory: "8 GiB"
        machine_type: "uefi"
        
        storage_devices:
          - name: "root-disk"
            type: "virtio_disk"
            source: "centos-stream"
            boot: 1
            capacity: "80 GB"
        
        network_devices:
          - name: "eth0"
            type: "virtio"
        
        tags:
          - "centos"
          - "enterprise"
          - "rhel-ecosystem"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            
            packages:
              - epel-release
              - htop
              - curl
              - wget
              - git
              - vim
              - bind-utils
              - net-tools
              - firewalld
            
            # Configure firewall
            runcmd:
              - systemctl enable firewalld
              - systemctl start firewalld
              - firewall-cmd --permanent --add-service=ssh
              - firewall-cmd --reload
              
              # SELinux configuration
              - setsebool -P httpd_can_network_connect on
              - semanage fcontext -a -t httpd_exec_t "/var/www/html(/.*)?"
              - restorecon -R /var/www/html
          
          meta_data: |
            instance-id: centos-stream
            local-hostname: centos-stream
```

## Development Environment

Linux development environment with common tools and IDEs.

### Development VM Manifest

```yaml title="dev-environment.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "dev-environment"
  labels:
    - "purpose:development"
    - "team:engineering"
spec:
  assets:
    - name: "ubuntu-dev"
      type: "virtual_disk"
      format: "raw"
      url: "https://your-dev-image-url.img"
  
  resources:
    - type: "virdomain"
      name: "dev-env"
      spec:
        description: "Linux development environment"
        cpu: 4
        memory: "8 GiB"
        machine_type: "uefi"
        
        storage_devices:
          - name: "system-disk"
            type: "virtio_disk"
            source: "ubuntu-dev"
            boot: 1
            capacity: "100 GB"
          - name: "projects-disk"
            type: "virtio_disk"
            capacity: "200 GB"
        
        network_devices:
          - name: "eth0"
            type: "virtio"
        
        tags:
          - "development"
          - "engineering"
          - "ide"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            
            packages:
              # Development tools
              - build-essential
              - cmake
              - git
              - curl
              - wget
              - vim
              - nano
              - htop
              - tree
              - jq
              
              # Programming languages
              - python3
              - python3-pip
              - python3-venv
              - nodejs
              - npm
              - default-jdk
              
              # Container tools
              - docker.io
              - docker-compose
              
              # IDE and editors
              - code
              - vim
              - emacs
            
            # Create developer user
            users:
              - name: developer
                primary_group: developer
                shell: /bin/bash
                sudo: ALL=(ALL) NOPASSWD:ALL
                groups: sudo, docker, adm
                lock_passwd: false
            
            # Setup development directories
            runcmd:
              - mkdir -p /home/developer/projects
              - mkdir -p /home/developer/workspace
              - chown -R developer:developer /home/developer
              
              # Mount projects disk
              - mkfs.ext4 /dev/vdb
              - mount /dev/vdb /home/developer/projects
              - echo "/dev/vdb /home/developer/projects ext4 defaults 0 0" >> /etc/fstab
              
              # Docker setup
              - systemctl enable docker
              - systemctl start docker
              - usermod -aG docker developer
              
              # Install additional tools
              - snap install code --classic
              - snap install postman
          
          meta_data: |
            instance-id: dev-env
            local-hostname: dev-env
```

## Common Linux Patterns

### Package Management

```yaml
# Ubuntu/Debian
packages:
  - apt-transport-https
  - software-properties-common
  - ca-certificates

# CentOS/RHEL
packages:
  - epel-release
  - yum-utils
  - device-mapper-persistent-data
```

### User Management

```yaml
users:
  - name: serviceuser
    system: true
    shell: /bin/false
    home: /var/lib/serviceuser
    create_home: true
  
  - name: developer
    groups: sudo, docker
    ssh_authorized_keys:
      - ssh-rsa AAAAB3NzaC1yc2E...
```

### Service Configuration

```yaml
runcmd:
  - systemctl enable myservice
  - systemctl start myservice
  - systemctl status myservice
  
  # Firewall rules
  - ufw allow 8080/tcp
  - firewall-cmd --permanent --add-port=8080/tcp
```

### Storage Setup

```yaml
# Format and mount additional storage
runcmd:
  - mkfs.ext4 /dev/vdb
  - mkdir -p /data
  - mount /dev/vdb /data
  - echo "/dev/vdb /data ext4 defaults 0 0" >> /etc/fstab
```

## Best Practices

### 1. Template Management

- **Use shutoff state** for template VMs
- **Set CPU to 0** prevents accidental bootup of templates
- **Minimize template size** for faster cloning
- **Include essential packages** only
- **Document template contents**

### 2. Security Configuration

```yaml
# Security hardening
runcmd:
  - ufw --force enable
  - fail2ban-server start
  - chmod 700 /home/user/.ssh
  - chmod 600 /home/user/.ssh/authorized_keys
```

### 3. Resource Optimization

```yaml
# Appropriate sizing
cpu: 2              # For web servers
memory: "4294967296"  # 4GB for moderate workloads
capacity: 42949672960 # 40GB for OS + applications
```

### 4. Cloud-Init Best Practices

- **Test cloud-init** configurations before deployment
- **Use package managers** for software installation
- **Handle errors gracefully** with proper scripting
- **Log activities** for troubleshooting

## Troubleshooting

### Common Issues

1. **Boot failures**: Check UEFI vs BIOS settings
2. **Package installation failures**: Verify repository access
3. **SSH access issues**: Check firewall and SSH key configuration
4. **Storage mounting failures**: Validate disk device paths

### Debug Commands

```bash
# Check cloud-init status
sudo cloud-init status

# View initialization logs
sudo cat /var/log/cloud-init-output.log

# Check system services
sudo systemctl status
```

## Related Examples

- **[Multi-VM Applications](multi-vm.md)** - Multiple Linux VMs
- **[Kubernetes](kubernetes.md)** - Linux-based K8s clusters
- **[Basic Examples](basic.md)** - Fundamental configurations
- **[GPU Applications](gpu.md)** - GPU-enabled Linux VMs

## Next Steps

1. **Customize** templates for your specific needs
2. **Add monitoring** and logging configuration
3. **Implement** backup strategies
4. **Scale** to multi-VM deployments
