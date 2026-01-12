# Multi-VM Applications

This section demonstrates how to deploy multiple virtual machines in a single Fleet Manager application manifest, enabling complex applications that span multiple VMs with different roles and configurations.

## Overview

Multi-VM applications enable:

- **Multi-tier architectures** (web, app, database tiers)
- **Mixed OS deployments** (Windows and Linux together)
- **Shared asset management** across multiple VMs
- **Complex application stacks** with interdependent services
- **Scalable architectures** with load balancing

## Multi-Tier Web Application

This example deploys a complete three-tier web application with separate VMs for web, application, and database tiers.

### Three-Tier Application Manifest

```yaml title="three-tier-webapp.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "three-tier-webapp"
  labels:
    - "architecture:three-tier"
    - "environment:production"
    - "application:webapp"
spec:
  assets:
    - name: "ubuntu-web"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/ubuntu-22.04-web.img"
    
    - name: "ubuntu-app"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/ubuntu-22.04-app.img"
    
    - name: "ubuntu-db"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/ubuntu-22.04-db.img"
  
  resources:
    # Web Tier - Load Balancer and Web Servers
    - type: "virdomain"
      name: "web-tier-lb"
      spec:
        description: "Load balancer for web tier"
        cpu: 2
        memory: "2147483648"  # 2 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "web-lb-disk"
            type: "virtio_disk"
            source: "ubuntu-web"
            boot: 1
            capacity: 32212254720  # 30 GB
        
        network_devices:
          - name: "public-net"
            type: "virtio"
          - name: "web-net"
            type: "virtio"
        
        tags:
          - "tier:web"
          - "role:load-balancer"
          - "nginx"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - nginx
              - keepalived
            
            write_files:
              - path: /etc/nginx/sites-available/webapp
                content: |
                  upstream app_servers {
                      server 192.168.1.10:8080;
                      server 192.168.1.11:8080;
                  }
                  
                  server {
                      listen 80;
                      server_name webapp.company.com;
                      
                      location / {
                          proxy_pass http://app_servers;
                          proxy_set_header Host $host;
                          proxy_set_header X-Real-IP $remote_addr;
                      }
                  }
            
            runcmd:
              - ln -s /etc/nginx/sites-available/webapp /etc/nginx/sites-enabled/
              - systemctl enable nginx
              - systemctl start nginx
          
          meta_data: |
            instance-id: web-tier-lb
            local-hostname: web-lb
    
    # Application Tier - App Servers
    - type: "virdomain"
      name: "app-tier-01"
      spec:
        description: "Application server 01"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "app-disk"
            type: "virtio_disk"
            source: "ubuntu-app"
            boot: 1
            capacity: 53687091200  # 50 GB
        
        network_devices:
          - name: "web-net"
            type: "virtio"
          - name: "app-net"
            type: "virtio"
        
        tags:
          - "tier:application"
          - "role:app-server"
          - "java"
          - "spring-boot"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - openjdk-11-jdk
              - maven
              - git
            
            users:
              - name: appuser
                system: true
                shell: /bin/false
                home: /opt/webapp
                create_home: true
            
            write_files:
              - path: /etc/systemd/system/webapp.service
                content: |
                  [Unit]
                  Description=Web Application
                  After=network.target
                  
                  [Service]
                  Type=simple
                  User=appuser
                  ExecStart=/usr/bin/java -jar /opt/webapp/app.jar
                  Restart=always
                  RestartSec=10
                  
                  [Install]
                  WantedBy=multi-user.target
            
            runcmd:
              - systemctl daemon-reload
              - systemctl enable webapp
              # Application deployment would happen here
          
          meta_data: |
            instance-id: app-tier-01
            local-hostname: app-server-01
    
    - type: "virdomain"
      name: "app-tier-02"
      spec:
        description: "Application server 02"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "app-disk"
            type: "virtio_disk"
            source: "ubuntu-app"
            boot: 1
            capacity: 53687091200  # 50 GB
        
        network_devices:
          - name: "web-net"
            type: "virtio"
          - name: "app-net"
            type: "virtio"
        
        tags:
          - "tier:application"
          - "role:app-server"
          - "java"
          - "spring-boot"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - openjdk-11-jdk
              - maven
              - git
            
            users:
              - name: appuser
                system: true
                shell: /bin/false
                home: /opt/webapp
                create_home: true
            
            write_files:
              - path: /etc/systemd/system/webapp.service
                content: |
                  [Unit]
                  Description=Web Application
                  After=network.target
                  
                  [Service]
                  Type=simple
                  User=appuser
                  ExecStart=/usr/bin/java -jar /opt/webapp/app.jar
                  Restart=always
                  RestartSec=10
                  
                  [Install]
                  WantedBy=multi-user.target
            
            runcmd:
              - systemctl daemon-reload
              - systemctl enable webapp
          
          meta_data: |
            instance-id: app-tier-02
            local-hostname: app-server-02
    
    # Database Tier - Primary and Replica
    - type: "virdomain"
      name: "db-tier-primary"
      spec:
        description: "Primary database server"
        cpu: 4
        memory: "16106127360"  # 15 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "db-system"
            type: "virtio_disk"
            source: "ubuntu-db"
            boot: 1
            capacity: 53687091200  # 50 GB
          - name: "db-data"
            type: "virtio_disk"
            capacity: 214748364800  # 200 GB
          - name: "db-logs"
            type: "virtio_disk"
            capacity: 107374182400  # 100 GB
        
        network_devices:
          - name: "app-net"
            type: "virtio"
          - name: "db-net"
            type: "virtio"
        
        tags:
          - "tier:database"
          - "role:primary"
          - "postgresql"
          - "backup"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - postgresql-14
              - postgresql-contrib
              - postgresql-14-repmgr
            
            runcmd:
              # Format and mount data disks
              - mkfs.ext4 /dev/vdb
              - mkfs.ext4 /dev/vdc
              - mkdir -p /var/lib/postgresql/data
              - mkdir -p /var/lib/postgresql/logs
              - mount /dev/vdb /var/lib/postgresql/data
              - mount /dev/vdc /var/lib/postgresql/logs
              - echo "/dev/vdb /var/lib/postgresql/data ext4 defaults 0 0" >> /etc/fstab
              - echo "/dev/vdc /var/lib/postgresql/logs ext4 defaults 0 0" >> /etc/fstab
              - chown -R postgres:postgres /var/lib/postgresql
              
              # Configure PostgreSQL
              - systemctl enable postgresql
              - systemctl start postgresql
              
              # Create application database
              - sudo -u postgres createdb webapp
              - sudo -u postgres psql -c "CREATE USER appuser WITH PASSWORD 'apppassword';"
              - sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE webapp TO appuser;"
          
          meta_data: |
            instance-id: db-tier-primary
            local-hostname: db-primary
    
    - type: "virdomain"
      name: "db-tier-replica"
      spec:
        description: "Database replica server"
        cpu: 4
        memory: "16106127360"  # 15 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "db-system"
            type: "virtio_disk"
            source: "ubuntu-db"
            boot: 1
            capacity: 53687091200  # 50 GB
          - name: "db-data"
            type: "virtio_disk"
            capacity: 214748364800  # 200 GB
        
        network_devices:
          - name: "app-net"
            type: "virtio"
          - name: "db-net"
            type: "virtio"
        
        tags:
          - "tier:database"
          - "role:replica"
          - "postgresql"
          - "read-only"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - postgresql-14
              - postgresql-contrib
              - postgresql-14-repmgr
            
            runcmd:
              # Format and mount data disk
              - mkfs.ext4 /dev/vdb
              - mkdir -p /var/lib/postgresql/data
              - mount /dev/vdb /var/lib/postgresql/data
              - echo "/dev/vdb /var/lib/postgresql/data ext4 defaults 0 0" >> /etc/fstab
              - chown -R postgres:postgres /var/lib/postgresql
              
              # Configure as replica (would need primary IP)
              - systemctl enable postgresql
              # Replica configuration would happen here
          
          meta_data: |
            instance-id: db-tier-replica
            local-hostname: db-replica
```

## Mixed OS Environment

This example demonstrates deploying both Windows and Linux VMs in a single application.

### Windows-Linux Mixed Environment

```yaml title="mixed-os-environment.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "mixed-os-enterprise"
  labels:
    - "architecture:mixed-os"
    - "environment:enterprise"
spec:
  assets:
    - name: "windows-server-2022"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/windows-server-2022.img"
    
    - name: "ubuntu-server"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/ubuntu-22.04-server.img"
  
  resources:
    # Windows Domain Controller
    - type: "virdomain"
      name: "windows-dc"
      spec:
        description: "Windows Server 2022 Domain Controller"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "tpm"
        
        storage_devices:
          - name: "dc-system"
            type: "virtio_disk"
            source: "windows-server-2022"
            boot: 1
            capacity: 107374182400  # 100 GB
        
        network_devices:
          - name: "domain-net"
            type: "virtio"
        
        tags:
          - "os:windows"
          - "role:domain-controller"
          - "service:active-directory"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            runcmd:
              - powershell -Command "Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools"
              - powershell -Command "Install-ADDSForest -DomainName 'company.local' -SafeModeAdministratorPassword (ConvertTo-SecureString 'P@ssw0rd123!' -AsPlainText -Force) -Force"
          
          meta_data: |
            instance-id: windows-dc-001
            local-hostname: dc01
    
    # Windows File Server
    - type: "virdomain"
      name: "windows-fileserver"
      spec:
        description: "Windows Server 2022 File Server"
        cpu: 2
        memory: "4294967296"  # 4 GB
        machine_type: "tpm"
        
        storage_devices:
          - name: "fs-system"
            type: "virtio_disk"
            source: "windows-server-2022"
            boot: 1
            capacity: 85899345920  # 80 GB
          - name: "fs-data"
            type: "virtio_disk"
            capacity: 536870912000  # 500 GB
        
        network_devices:
          - name: "domain-net"
            type: "virtio"
        
        tags:
          - "os:windows"
          - "role:file-server"
          - "service:smb"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            runcmd:
              - powershell -Command "Install-WindowsFeature -Name File-Services -IncludeManagementTools"
              - powershell -Command "Initialize-Disk -Number 1 -PartitionStyle MBR -PassThru | New-Partition -UseMaximumSize -AssignDriveLetter | Format-Volume -FileSystem NTFS -NewFileSystemLabel 'SharedData' -Confirm:$false"
          
          meta_data: |
            instance-id: windows-fileserver-001
            local-hostname: fileserver01
    
    # Linux Web Server
    - type: "virdomain"
      name: "linux-webserver"
      spec:
        description: "Ubuntu 22.04 Web Server"
        cpu: 2
        memory: "4294967296"  # 4 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "web-system"
            type: "virtio_disk"
            source: "ubuntu-server"
            boot: 1
            capacity: 53687091200  # 50 GB
        
        network_devices:
          - name: "domain-net"
            type: "virtio"
        
        tags:
          - "os:linux"
          - "role:web-server"
          - "service:apache"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - apache2
              - realmd
              - sssd
              - adcli
              - krb5-user
            
            runcmd:
              - systemctl enable apache2
              - systemctl start apache2
              
              # Join domain (requires proper DNS configuration)
              - realm join company.local
          
          meta_data: |
            instance-id: linux-webserver-001
            local-hostname: webserver01
    
    # Linux Database Server
    - type: "virdomain"
      name: "linux-database"
      spec:
        description: "Ubuntu 22.04 Database Server"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "db-system"
            type: "virtio_disk"
            source: "ubuntu-server"
            boot: 1
            capacity: 53687091200  # 50 GB
          - name: "db-data"
            type: "virtio_disk"
            capacity: 214748364800  # 200 GB
        
        network_devices:
          - name: "domain-net"
            type: "virtio"
        
        tags:
          - "os:linux"
          - "role:database"
          - "service:mysql"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - mysql-server
              - mysql-client
            
            runcmd:
              - mkfs.ext4 /dev/vdb
              - mkdir -p /var/lib/mysql-data
              - mount /dev/vdb /var/lib/mysql-data
              - echo "/dev/vdb /var/lib/mysql-data ext4 defaults 0 0" >> /etc/fstab
              - chown -R mysql:mysql /var/lib/mysql-data
              
              - systemctl enable mysql
              - systemctl start mysql
              
              - mysql -e "CREATE DATABASE webapp;"
              - mysql -e "CREATE USER 'appuser'@'%' IDENTIFIED BY 'apppassword';"
              - mysql -e "GRANT ALL PRIVILEGES ON webapp.* TO 'appuser'@'%';"
              - mysql -e "FLUSH PRIVILEGES;"
          
          meta_data: |
            instance-id: linux-database-001
            local-hostname: dbserver01
```

## Microservices Architecture

This example shows a microservices deployment with multiple service VMs.

### Microservices Deployment

```yaml title="microservices-stack.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "microservices-stack"
  labels:
    - "architecture:microservices"
    - "deployment:kubernetes"
spec:
  assets:
    - name: "k8s-node"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/ubuntu-22.04-k8s.img"
  
  resources:
    # Kubernetes Master Node
    - type: "virdomain"
      name: "k8s-master"
      spec:
        description: "Kubernetes master node"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "master-disk"
            type: "virtio_disk"
            source: "k8s-node"
            boot: 1
            capacity: 85899345920  # 80 GB
        
        network_devices:
          - name: "k8s-net"
            type: "virtio"
        
        tags:
          - "kubernetes"
          - "master"
          - "control-plane"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - docker.io
              - kubeadm
              - kubelet
              - kubectl
            
            runcmd:
              - systemctl enable docker
              - systemctl start docker
              - kubeadm init --pod-network-cidr=10.244.0.0/16
              - mkdir -p /root/.kube
              - cp /etc/kubernetes/admin.conf /root/.kube/config
              - kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml
          
          meta_data: |
            instance-id: k8s-master-001
            local-hostname: k8s-master
    
    # Kubernetes Worker Nodes
    - type: "virdomain"
      name: "k8s-worker-01"
      spec:
        description: "Kubernetes worker node 01"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "worker-disk"
            type: "virtio_disk"
            source: "k8s-node"
            boot: 1
            capacity: 85899345920  # 80 GB
        
        network_devices:
          - name: "k8s-net"
            type: "virtio"
        
        tags:
          - "kubernetes"
          - "worker"
          - "compute"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - docker.io
              - kubeadm
              - kubelet
            
            runcmd:
              - systemctl enable docker
              - systemctl start docker
              # Join command would be retrieved from master
          
          meta_data: |
            instance-id: k8s-worker-01
            local-hostname: k8s-worker-01
    
    - type: "virdomain"
      name: "k8s-worker-02"
      spec:
        description: "Kubernetes worker node 02"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "worker-disk"
            type: "virtio_disk"
            source: "k8s-node"
            boot: 1
            capacity: 85899345920  # 80 GB
        
        network_devices:
          - name: "k8s-net"
            type: "virtio"
        
        tags:
          - "kubernetes"
          - "worker"
          - "compute"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - docker.io
              - kubeadm
              - kubelet
            
            runcmd:
              - systemctl enable docker
              - systemctl start docker
          
          meta_data: |
            instance-id: k8s-worker-02
            local-hostname: k8s-worker-02
```

## Common Multi-VM Patterns

### Load Balancer Configuration

```yaml
# HAProxy load balancer
write_files:
  - path: /etc/haproxy/haproxy.cfg
    content: |
      global
          daemon
      
      defaults
          mode http
          timeout connect 5000ms
          timeout client 50000ms
          timeout server 50000ms
      
      frontend web_frontend
          bind *:80
          default_backend web_servers
      
      backend web_servers
          balance roundrobin
          server web1 192.168.1.10:80 check
          server web2 192.168.1.11:80 check
```

### Database Clustering

```yaml
# MySQL cluster configuration
runcmd:
  - mysql -e "CREATE USER 'cluster'@'%' IDENTIFIED BY 'clusterpass';"
  - mysql -e "GRANT REPLICATION SLAVE ON *.* TO 'cluster'@'%';"
  - mysql -e "FLUSH PRIVILEGES;"
  
  # Configure replication
  - mysql -e "CHANGE MASTER TO MASTER_HOST='192.168.1.10', MASTER_USER='cluster', MASTER_PASSWORD='clusterpass';"
  - mysql -e "START SLAVE;"
```

### Service Discovery

```yaml
# Consul service discovery
packages:
  - consul

write_files:
  - path: /etc/consul/consul.json
    content: |
      {
        "datacenter": "dc1",
        "data_dir": "/var/lib/consul",
        "log_level": "INFO",
        "server": true,
        "bootstrap_expect": 3,
        "retry_join": ["192.168.1.10", "192.168.1.11", "192.168.1.12"]
      }
```

## Best Practices

### 1. Resource Planning

```yaml
# Plan resources by tier
# Web tier: 2 CPU, 4GB RAM
# App tier: 4 CPU, 8GB RAM  
# DB tier: 4 CPU, 16GB RAM
```

### 2. Network Segmentation

```yaml
# Use multiple networks for security
network_devices:
  - name: "public-net"    # External access
    type: "virtio"
  - name: "private-net"   # Internal communication
    type: "virtio"
```

### 3. Asset Reuse

```yaml
# Reuse base images across VMs
assets:
  - name: "ubuntu-base"
    type: "virtual_disk"
    format: "raw"
    url: "https://example.com/ubuntu-base.img"

# Reference in multiple VMs
storage_devices:
  - name: "system-disk"
    source: "ubuntu-base"
```

### 4. Configuration Management

```yaml
# Use consistent naming
name: "app-tier-{{ instance_id }}"
tags:
  - "tier:{{ tier_name }}"
  - "role:{{ role_name }}"
  - "environment:{{ environment }}"
```

## Troubleshooting

### Common Issues

1. **Inter-VM communication**: Check network configuration
2. **Resource contention**: Monitor CPU and memory usage
3. **Storage conflicts**: Ensure unique storage device names
4. **Service dependencies**: Verify startup order

### Monitoring

```yaml
# Add monitoring to each VM
packages:
  - prometheus-node-exporter
  - collectd
  - rsyslog

runcmd:
  - systemctl enable prometheus-node-exporter
  - systemctl start prometheus-node-exporter
```

## Related Examples

- **[Linux Templates](linux.md)** - Linux-specific configurations
- **[Windows Templates](windows.md)** - Windows-specific configurations
- **[Kubernetes](kubernetes.md)** - Container orchestration
- **[GPU Applications](gpu.md)** - GPU-enabled multi-VM setups

## Next Steps

1. **Implement** service discovery mechanisms
2. **Add** load balancing and high availability
3. **Configure** monitoring and alerting
4. **Scale** horizontally with additional VMs
