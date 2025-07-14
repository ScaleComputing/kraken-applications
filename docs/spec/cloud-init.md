# Cloud-Init Specification

Cloud-init is a powerful system for automating the initialization and configuration of virtual machines. Kraken manifests support cloud-init through the `cloud_init_data` field in VirDomain resources, enabling automated VM setup, package installation, and service configuration.

## Overview

Cloud-init runs during the first boot of a virtual machine and can:

- Configure users and SSH keys
- Install packages and software
- Set up services and systemd units
- Configure networking and storage
- Run arbitrary commands and scripts
- Manage files and directories

## Cloud-Init Structure

Cloud-init data in Kraken manifests consists of two main components:

```yaml
cloud_init_data:
  user_data: |
    #cloud-config
    # Your cloud-init configuration here
  meta_data: |
    instance-id: vm-001
    local-hostname: my-vm
```

## User Data

The `user_data` field contains the main cloud-init configuration in YAML format.

### Basic Structure

```yaml
cloud_init_data:
  user_data: |
    #cloud-config
    package_update: true
    package_upgrade: true
    
    packages:
      - nginx
      - htop
      - curl
    
    runcmd:
      - systemctl enable nginx
      - systemctl start nginx
```

### Common Configuration Options

#### Package Management

```yaml
user_data: |
  #cloud-config
  # Update package lists
  package_update: true
  
  # Upgrade existing packages
  package_upgrade: true
  
  # Install packages
  packages:
    - git
    - docker.io
    - python3-pip
    - build-essential
  
  # Add package repositories
  apt:
    sources:
      docker:
        source: "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
        key: |
          -----BEGIN PGP PUBLIC KEY BLOCK-----
          # Docker GPG key content
          -----END PGP PUBLIC KEY BLOCK-----
```

#### User Management

```yaml
user_data: |
  #cloud-config
  # Set root password
  chpasswd:
    list: |
      root:securepassword123
    expire: false
  
  # Create users
  users:
    - name: admin
      primary_group: admin
      plain_text_passwd: 'userpassword'
      lock_passwd: false
      shell: /bin/bash
      sudo: ALL=(ALL) NOPASSWD:ALL
      ssh_import_id: ["gh:username"]
      groups: sudo, docker, adm
    
    - name: developer
      gecos: "Developer Account"
      groups: sudo, docker
      ssh_authorized_keys:
        - ssh-rsa AAAAB3NzaC1yc2E... user@example.com
```

#### File Management

```yaml
user_data: |
  #cloud-config
  write_files:
    - path: /etc/nginx/sites-available/default
      permissions: '0644'
      content: |
        server {
            listen 80 default_server;
            server_name _;
            root /var/www/html;
            index index.html;
        }
    
    - path: /etc/systemd/system/myapp.service
      permissions: '0644'
      content: |
        [Unit]
        Description=My Application
        After=network.target
        
        [Service]
        Type=simple
        ExecStart=/usr/local/bin/myapp
        Restart=always
        
        [Install]
        WantedBy=multi-user.target
```

#### Command Execution

```yaml
user_data: |
  #cloud-config
  # Run commands during cloud-init
  runcmd:
    - echo "Starting application setup"
    - mkdir -p /app/data
    - chown -R www-data:www-data /app
    - systemctl enable myapp
    - systemctl start myapp
    - echo "Setup complete"
  
  # Run commands on first boot only
  bootcmd:
    - echo "This runs on every boot"
    - mount /dev/sdb1 /data
```

#### Storage and Filesystems

```yaml
user_data: |
  #cloud-config
  # Resize root filesystem
  growpart:
    mode: auto
    devices: ['/']
  
  resizefs:
    device: /
  
  # Mount additional storage
  mounts:
    - ["/dev/sdb1", "/data", "ext4", "defaults", "0", "2"]
  
  # Format and mount storage
  disk_setup:
    /dev/sdb:
      table_type: gpt
      layout: true
      overwrite: false
  
  fs_setup:
    - label: data-disk
      filesystem: ext4
      device: /dev/sdb1
      overwrite: false
```

## Meta Data

The `meta_data` field provides instance-specific information:

```yaml
cloud_init_data:
  meta_data: |
    instance-id: unique-vm-identifier
    local-hostname: my-vm-name
    public-keys:
      - ssh-rsa AAAAB3NzaC1yc2E... user@example.com
```

### Common Meta Data Fields

- **instance-id**: Unique identifier for the VM instance
- **local-hostname**: Hostname for the VM
- **public-keys**: SSH public keys for access
- **availability-zone**: Cloud provider availability zone
- **region**: Cloud provider region

## Real-World Examples

### Web Server Setup

```yaml
cloud_init_data:
  user_data: |
    #cloud-config
    package_update: true
    packages:
      - nginx
      - certbot
      - python3-certbot-nginx
    
    write_files:
      - path: /var/www/html/index.html
        content: |
          <!DOCTYPE html>
          <html>
          <head><title>Welcome</title></head>
          <body><h1>Server is running!</h1></body>
          </html>
    
    runcmd:
      - systemctl enable nginx
      - systemctl start nginx
      - ufw allow 'Nginx Full'
      - ufw --force enable
  
  meta_data: |
    instance-id: web-server-001
    local-hostname: web-server
```

### Docker Application

```yaml
cloud_init_data:
  user_data: |
    #cloud-config
    package_update: true
    packages:
      - docker.io
      - docker-compose
    
    users:
      - name: app
        groups: docker
        shell: /bin/bash
        sudo: ALL=(ALL) NOPASSWD:ALL
    
    write_files:
      - path: /app/docker-compose.yml
        content: |
          version: '3.8'
          services:
            web:
              image: nginx:latest
              ports:
                - "80:80"
              restart: unless-stopped
    
    runcmd:
      - systemctl enable docker
      - systemctl start docker
      - cd /app && docker-compose up -d
  
  meta_data: |
    instance-id: docker-app-001
    local-hostname: docker-app
```

### Kubernetes Node

```yaml
cloud_init_data:
  user_data: |
    #cloud-config
    package_update: true
    package_upgrade: true
    
    packages:
      - curl
      - apt-transport-https
      - ca-certificates
      - gnupg
      - lsb-release
    
    # Resize root filesystem
    growpart:
      mode: auto
      devices: ['/']
    resizefs:
      device: /
    
    runcmd:
      # Install K3s
      - curl -sfL https://get.k3s.io | sh -
      
      # Configure kubectl for root
      - mkdir -p /root/.kube
      - cp /etc/rancher/k3s/k3s.yaml /root/.kube/config
      - chmod 600 /root/.kube/config
      
      # Install Helm
      - curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
      
      # Deploy monitoring
      - helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
      - helm repo update
      - helm install prometheus prometheus-community/kube-prometheus-stack
    
    # Reboot after setup
    power_state:
      mode: reboot
      message: "Rebooting after K3s installation"
      timeout: 60
      condition: true
  
  meta_data: |
    instance-id: k3s-node-001
    local-hostname: k3s-master
```

## Advanced Features

### Conditional Execution

```yaml
user_data: |
  #cloud-config
  # Only run on specific OS
  conditionals:
    - path: /etc/os-release
      content: "Ubuntu"
      runcmd:
        - apt-get update
        - apt-get install -y ubuntu-specific-package
```

### Multi-Stage Setup

```yaml
user_data: |
  #cloud-config
  # Stage 1: Basic setup
  bootcmd:
    - echo "Stage 1: Boot setup"
  
  # Stage 2: Package installation
  packages:
    - base-packages
  
  # Stage 3: Configuration
  write_files:
    - path: /etc/app/config.yml
      content: |
        stage: configuration
  
  # Stage 4: Service start
  runcmd:
    - echo "Stage 4: Starting services"
    - systemctl enable myapp
  
  # Stage 5: Final setup
  final_message: "Cloud-init setup complete!"
```

### Error Handling

```yaml
user_data: |
  #cloud-config
  # Continue on errors
  runcmd:
    - set +e  # Don't exit on error
    - command_that_might_fail || echo "Command failed, continuing"
    - set -e  # Exit on error again
    - critical_command
  
  # Logging
  output:
    all: ">> /var/log/cloud-init-output.log"
    errors: ">> /var/log/cloud-init-errors.log"
```

## Best Practices

### 1. Testing and Validation

```yaml
# Test cloud-init syntax
user_data: |
  #cloud-config
  # Always start with this header
  package_update: true
  
  # Test with minimal configuration first
  runcmd:
    - echo "Testing cloud-init"
    - date >> /var/log/cloud-init-test.log
```

### 2. Security Considerations

```yaml
user_data: |
  #cloud-config
  # Don't hardcode passwords in production
  users:
    - name: admin
      ssh_authorized_keys:
        - ssh-rsa AAAAB3NzaC1yc2E... # Use SSH keys
  
  # Use secure permissions
  write_files:
    - path: /etc/ssl/private/key.pem
      permissions: '0600'
      content: |
        # Private key content
```

### 3. Idempotency

```yaml
user_data: |
  #cloud-config
  # Make operations idempotent
  runcmd:
    - systemctl is-enabled nginx || systemctl enable nginx
    - systemctl is-active nginx || systemctl start nginx
    - test -f /app/setup.done || /app/setup.sh
    - touch /app/setup.done
```

### 4. Resource Management

```yaml
user_data: |
  #cloud-config
  # Optimize resource usage
  package_update: true
  package_upgrade: false  # Skip unless necessary
  
  # Clean up after installation
  runcmd:
    - apt-get autoremove -y
    - apt-get autoclean
    - rm -rf /tmp/setup-files
```

## Troubleshooting

### Common Issues

1. **YAML Syntax Errors**: Validate YAML syntax before deployment
2. **Command Failures**: Check `/var/log/cloud-init-output.log`
3. **Permission Issues**: Verify file permissions and ownership
4. **Service Failures**: Check systemd service status
5. **Network Issues**: Ensure package repositories are accessible

### Debug Commands

```bash
# Check cloud-init status
sudo cloud-init status

# View cloud-init logs
sudo cat /var/log/cloud-init-output.log
sudo cat /var/log/cloud-init.log

# Re-run cloud-init (for testing)
sudo cloud-init clean
sudo cloud-init init
```

### Validation

```bash
# Validate cloud-init syntax
sudo cloud-init schema --config-file user-data.yml

# Test cloud-init configuration
sudo cloud-init query --all
```

## Related Documentation

- **[VirDomain Reference](virdomain.md)** - Virtual machine specification
- **[Examples](../examples/basic.md)** - Practical manifest examples
- **[Kubernetes Example](../examples/kubernetes.md)** - K3s deployment
- **[GPU Applications](../examples/gpu.md)** - GPU-accelerated applications
- **[Cloud-Init Documentation](https://cloudinit.readthedocs.io/)** - Official cloud-init docs