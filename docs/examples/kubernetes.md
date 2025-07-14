# Kubernetes

This section demonstrates how to deploy Kubernetes clusters using Kraken manifests, including single-node K3s installations, multi-node clusters, and specialized Kubernetes workloads.

## Overview

Kubernetes deployments with Kraken provide:

- **Single-node K3s** for development and testing
- **Multi-node clusters** for production workloads
- **Automated setup** with cloud-init
- **Monitoring integration** (Prometheus, Grafana)
- **GPU support** for ML workloads
- **High availability** configurations

## Single-Node K3s Cluster

This example deploys a complete single-node Kubernetes cluster using K3s with monitoring stack.

### K3s Single-Node Manifest

```yaml title="k3s-single-node.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "k3s-single-node"
  labels:
    - "kubernetes:k3s"
    - "environment:development"
    - "monitoring:enabled"
spec:
  assets:
    - name: "ubuntu-k3s"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/ubuntu-22.04-k3s.img"
  
  resources:
    - type: "virdomain"
      name: "k3s-master"
      spec:
        description: "Single-node K3s cluster with monitoring"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "k3s-system"
            type: "virtio_disk"
            source: "ubuntu-k3s"
            boot: 1
            capacity: 85899345920  # 80 GB
        
        network_devices:
          - name: "k3s-net"
            type: "virtio"
        
        tags:
          - "kubernetes"
          - "k3s"
          - "master"
          - "monitoring"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            package_upgrade: true
            
            packages:
              - curl
              - wget
              - git
              - htop
              - jq
              - apt-transport-https
              - ca-certificates
              - gnupg
              - lsb-release
              - qemu-guest-agent
              - cloud-guest-utils
              - gdisk
            
            # Resize root filesystem
            growpart:
              mode: auto
              devices: ['/']
            resizefs:
              device: /
            
            # Create K3s user
            users:
              - name: k3s
                primary_group: k3s
                shell: /bin/bash
                sudo: ALL=(ALL) NOPASSWD:ALL
                groups: sudo, adm
                lock_passwd: false
            
            runcmd:
              # Enable and start qemu-guest-agent
              - systemctl enable qemu-guest-agent
              - systemctl start qemu-guest-agent
              
              # Install K3s
              - curl -sfL https://get.k3s.io | sh -
              
              # Configure kubectl for root
              - mkdir -p /root/.kube
              - cp /etc/rancher/k3s/k3s.yaml /root/.kube/config
              - chmod 600 /root/.kube/config
              
              # Configure kubectl for k3s user
              - mkdir -p /home/k3s/.kube
              - cp /etc/rancher/k3s/k3s.yaml /home/k3s/.kube/config
              - chown -R k3s:k3s /home/k3s/.kube
              - chmod 600 /home/k3s/.kube/config
              
              # Install Helm
              - curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
              
              # Wait for K3s to be ready
              - sleep 30
              - kubectl wait --for=condition=Ready nodes --all --timeout=300s
              
              # Install monitoring stack
              - helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
              - helm repo add grafana https://grafana.github.io/helm-charts
              - helm repo update
              
              # Create monitoring namespace
              - kubectl create namespace monitoring
              
              # Install Prometheus and Grafana
              - helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --set grafana.adminPassword=admin123
              
              # Install Node Exporter
              - helm install node-exporter prometheus-community/prometheus-node-exporter -n monitoring
              
              # Create sample application
              - kubectl create deployment nginx --image=nginx
              - kubectl expose deployment nginx --port=80 --type=LoadBalancer
          
          meta_data: |
            instance-id: k3s-single-node-001
            local-hostname: k3s-master
```

### Accessing the Cluster

After deployment, you can access:

- **Kubernetes API**: `kubectl get nodes`
- **Grafana Dashboard**: `http://node-ip:3000` (admin/admin123)
- **Prometheus**: `http://node-ip:9090`
- **Sample Nginx App**: `http://node-ip` (via LoadBalancer)

## Multi-Node K3s Cluster

This example creates a high-availability K3s cluster with multiple nodes.

### Multi-Node K3s Manifest

```yaml title="k3s-multi-node.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "k3s-multi-node-cluster"
  labels:
    - "kubernetes:k3s"
    - "environment:production"
    - "ha:enabled"
spec:
  assets:
    - name: "ubuntu-k3s"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/ubuntu-22.04-k3s.img"
  
  resources:
    # K3s Server (Master) Node
    - type: "virdomain"
      name: "k3s-server-01"
      spec:
        description: "K3s server node 01"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "server-disk"
            type: "virtio_disk"
            source: "ubuntu-k3s"
            boot: 1
            capacity: 85899345920  # 80 GB
        
        network_devices:
          - name: "cluster-net"
            type: "virtio"
        
        tags:
          - "kubernetes"
          - "k3s"
          - "server"
          - "control-plane"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - curl
              - wget
              - htop
              - jq
            
            # Resize root filesystem
            growpart:
              mode: auto
              devices: ['/']
            resizefs:
              device: /
            
            runcmd:
              # Install K3s server
              - curl -sfL https://get.k3s.io | sh -s - server --cluster-init --token=mytoken123
              
              # Configure kubectl
              - mkdir -p /root/.kube
              - cp /etc/rancher/k3s/k3s.yaml /root/.kube/config
              - chmod 600 /root/.kube/config
              
              # Install Helm
              - curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
          
          meta_data: |
            instance-id: k3s-server-01
            local-hostname: k3s-server-01
    
    # Additional K3s Server Node for HA
    - type: "virdomain"
      name: "k3s-server-02"
      spec:
        description: "K3s server node 02"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "server-disk"
            type: "virtio_disk"
            source: "ubuntu-k3s"
            boot: 1
            capacity: 85899345920  # 80 GB
        
        network_devices:
          - name: "cluster-net"
            type: "virtio"
        
        tags:
          - "kubernetes"
          - "k3s"
          - "server"
          - "control-plane"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - curl
              - wget
              - htop
              - jq
            
            # Resize root filesystem
            growpart:
              mode: auto
              devices: ['/']
            resizefs:
              device: /
            
            runcmd:
              # Join as additional server (requires first server IP)
              - curl -sfL https://get.k3s.io | sh -s - server --server https://192.168.1.10:6443 --token=mytoken123
              
              # Configure kubectl
              - mkdir -p /root/.kube
              - cp /etc/rancher/k3s/k3s.yaml /root/.kube/config
              - chmod 600 /root/.kube/config
          
          meta_data: |
            instance-id: k3s-server-02
            local-hostname: k3s-server-02
    
    # K3s Agent (Worker) Nodes
    - type: "virdomain"
      name: "k3s-agent-01"
      spec:
        description: "K3s agent node 01"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "agent-disk"
            type: "virtio_disk"
            source: "ubuntu-k3s"
            boot: 1
            capacity: 85899345920  # 80 GB
        
        network_devices:
          - name: "cluster-net"
            type: "virtio"
        
        tags:
          - "kubernetes"
          - "k3s"
          - "agent"
          - "worker"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - curl
              - wget
              - htop
            
            # Resize root filesystem
            growpart:
              mode: auto
              devices: ['/']
            resizefs:
              device: /
            
            runcmd:
              # Join as agent (requires server IP)
              - curl -sfL https://get.k3s.io | K3S_URL=https://192.168.1.10:6443 K3S_TOKEN=mytoken123 sh -
          
          meta_data: |
            instance-id: k3s-agent-01
            local-hostname: k3s-agent-01
    
    - type: "virdomain"
      name: "k3s-agent-02"
      spec:
        description: "K3s agent node 02"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "agent-disk"
            type: "virtio_disk"
            source: "ubuntu-k3s"
            boot: 1
            capacity: 85899345920  # 80 GB
        
        network_devices:
          - name: "cluster-net"
            type: "virtio"
        
        tags:
          - "kubernetes"
          - "k3s"
          - "agent"
          - "worker"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - curl
              - wget
              - htop
            
            # Resize root filesystem
            growpart:
              mode: auto
              devices: ['/']
            resizefs:
              device: /
            
            runcmd:
              # Join as agent
              - curl -sfL https://get.k3s.io | K3S_URL=https://192.168.1.10:6443 K3S_TOKEN=mytoken123 sh -
          
          meta_data: |
            instance-id: k3s-agent-02
            local-hostname: k3s-agent-02
```

## GPU-Enabled Kubernetes

This example shows a Kubernetes cluster with GPU support for ML workloads.

### GPU Kubernetes Manifest

```yaml title="k3s-gpu-cluster.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "k3s-gpu-cluster"
  labels:
    - "kubernetes:k3s"
    - "gpu:nvidia"
    - "workload:ml"
spec:
  assets:
    - name: "ubuntu-gpu-k3s"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/ubuntu-22.04-gpu-k3s.img"
  
  resources:
    # K3s Server Node
    - type: "virdomain"
      name: "k3s-gpu-server"
      spec:
        description: "K3s server node for GPU cluster"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "server-disk"
            type: "virtio_disk"
            source: "ubuntu-gpu-k3s"
            boot: 1
            capacity: 85899345920  # 80 GB
        
        network_devices:
          - name: "gpu-cluster-net"
            type: "virtio"
        
        tags:
          - "kubernetes"
          - "k3s"
          - "server"
          - "gpu-cluster"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - curl
              - wget
              - htop
              - jq
            
            runcmd:
              # Install K3s server
              - curl -sfL https://get.k3s.io | sh -s - server --token=gputoken123
              
              # Configure kubectl
              - mkdir -p /root/.kube
              - cp /etc/rancher/k3s/k3s.yaml /root/.kube/config
              - chmod 600 /root/.kube/config
              
              # Install Helm
              - curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
              
              # Wait for K3s to be ready
              - sleep 30
              - kubectl wait --for=condition=Ready nodes --all --timeout=300s
              
              # Install NVIDIA GPU Operator
              - helm repo add nvidia https://nvidia.github.io/gpu-operator
              - helm repo update
              - helm install gpu-operator nvidia/gpu-operator -n gpu-operator --create-namespace
          
          meta_data: |
            instance-id: k3s-gpu-server
            local-hostname: k3s-gpu-server
    
    # GPU Worker Node
    - type: "virdomain"
      name: "k3s-gpu-worker"
      spec:
        description: "K3s GPU worker node"
        cpu: 8
        memory: "17179869184"  # 16 GB
        machine_type: "bios"  # GPU VMs often use BIOS
        
        storage_devices:
          - name: "worker-disk"
            type: "virtio_disk"
            source: "ubuntu-gpu-k3s"
            boot: 1
            capacity: 107374182400  # 100 GB
        
        network_devices:
          - name: "gpu-cluster-net"
            type: "virtio"
        
        tags:
          - "kubernetes"
          - "k3s"
          - "worker"
          - "gpu"
          - "ml"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - curl
              - wget
              - htop
              - nvidia-driver-525
              - nvidia-container-toolkit
            
            runcmd:
              # Install Docker
              - curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
              - add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
              - apt-get update
              - apt-get install -y docker-ce docker-ce-cli containerd.io
              
              # Configure Docker for GPU
              - nvidia-ctk runtime configure --runtime=docker
              - systemctl restart docker
              
              # Join K3s cluster
              - curl -sfL https://get.k3s.io | K3S_URL=https://192.168.1.10:6443 K3S_TOKEN=gputoken123 sh -
              
              # Reboot to ensure GPU drivers are loaded
              - reboot
          
          meta_data: |
            instance-id: k3s-gpu-worker
            local-hostname: k3s-gpu-worker
```

## Kubernetes with Persistent Storage

This example includes persistent storage configuration for stateful applications.

### K3s with Longhorn Storage

```yaml title="k3s-longhorn-storage.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "k3s-longhorn-storage"
  labels:
    - "kubernetes:k3s"
    - "storage:longhorn"
    - "stateful:enabled"
spec:
  assets:
    - name: "ubuntu-k3s-storage"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/ubuntu-22.04-k3s.img"
  
  resources:
    # K3s Server with Longhorn
    - type: "virdomain"
      name: "k3s-longhorn-server"
      spec:
        description: "K3s server with Longhorn storage"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: "system-disk"
            type: "virtio_disk"
            source: "ubuntu-k3s-storage"
            boot: 1
            capacity: 85899345920  # 80 GB
          - name: "longhorn-disk"
            type: "virtio_disk"
            capacity: 214748364800  # 200 GB for Longhorn
        
        network_devices:
          - name: "storage-net"
            type: "virtio"
        
        tags:
          - "kubernetes"
          - "k3s"
          - "server"
          - "longhorn"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            package_update: true
            packages:
              - curl
              - wget
              - htop
              - jq
              - open-iscsi
            
            runcmd:
              # Format Longhorn disk
              - mkfs.ext4 /dev/vdb
              - mkdir -p /var/lib/longhorn
              - mount /dev/vdb /var/lib/longhorn
              - echo "/dev/vdb /var/lib/longhorn ext4 defaults 0 0" >> /etc/fstab
              
              # Install K3s
              - curl -sfL https://get.k3s.io | sh -s - server --token=longhorntoken123
              
              # Configure kubectl
              - mkdir -p /root/.kube
              - cp /etc/rancher/k3s/k3s.yaml /root/.kube/config
              - chmod 600 /root/.kube/config
              
              # Install Helm
              - curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
              
              # Wait for K3s to be ready
              - sleep 30
              - kubectl wait --for=condition=Ready nodes --all --timeout=300s
              
              # Install Longhorn
              - helm repo add longhorn https://charts.longhorn.io
              - helm repo update
              - helm install longhorn longhorn/longhorn --namespace longhorn-system --create-namespace
              
              # Create storage class
              - kubectl apply -f - <<EOF
                apiVersion: storage.k8s.io/v1
                kind: StorageClass
                metadata:
                  name: longhorn-fast
                provisioner: driver.longhorn.io
                allowVolumeExpansion: true
                parameters:
                  numberOfReplicas: "1"
                  staleReplicaTimeout: "30"
                  fromBackup: ""
                EOF
          
          meta_data: |
            instance-id: k3s-longhorn-server
            local-hostname: k3s-longhorn-server
```

## Common Kubernetes Patterns

### Monitoring Stack

```yaml
# Prometheus and Grafana installation
runcmd:
  - helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
  - helm repo update
  - helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

### Ingress Controller

```yaml
# Traefik ingress (default in K3s)
runcmd:
  - kubectl apply -f - <<EOF
    apiVersion: networking.k8s.io/v1
    kind: Ingress
    metadata:
      name: example-ingress
    spec:
      rules:
      - host: example.local
        http:
          paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: example-service
                port:
                  number: 80
    EOF
```

### Cert-Manager

```yaml
# SSL certificate management
runcmd:
  - helm repo add jetstack https://charts.jetstack.io
  - helm repo update
  - helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --set installCRDs=true
```

### ArgoCD for GitOps

```yaml
# GitOps deployment
runcmd:
  - kubectl create namespace argocd
  - kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
  - kubectl patch svc argocd-server -n argocd -p '{"spec":{"type":"LoadBalancer"}}'
```

## Best Practices

### 1. Resource Allocation

```yaml
# Minimum K3s requirements
cpu: 2                    # Master nodes
memory: "4294967296"      # 4GB for master
capacity: 42949672960     # 40GB storage

# Production recommendations
cpu: 4                    # Master nodes
memory: "8589934592"      # 8GB for master
capacity: 85899345920     # 80GB storage
```

### 2. Security Configuration

```yaml
# Secure K3s installation
runcmd:
  - curl -sfL https://get.k3s.io | sh -s - server --token=securetokenhere --tls-san=your-domain.com
  - chmod 600 /etc/rancher/k3s/k3s.yaml
```

### 3. Network Configuration

```yaml
# Custom CNI configuration
runcmd:
  - curl -sfL https://get.k3s.io | sh -s - server --flannel-backend=none
  - kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

### 4. High Availability

```yaml
# HA K3s cluster
runcmd:
  - curl -sfL https://get.k3s.io | sh -s - server --cluster-init --token=hatoken123
  # Additional servers join with: --server https://first-server:6443
```

## Troubleshooting

### Common Issues

1. **Node not joining**: Check token and server URL
2. **Pods not starting**: Check image pull and resource limits
3. **Storage issues**: Verify persistent volume claims
4. **Network connectivity**: Check CNI configuration

### Debug Commands

```bash
# Check cluster status
kubectl get nodes -o wide
kubectl get pods --all-namespaces

# Check K3s logs
sudo journalctl -u k3s
sudo journalctl -u k3s-agent

# Check system resources
kubectl top nodes
kubectl top pods --all-namespaces
```

## Related Examples

- **[GPU Applications](gpu.md)** - GPU-enabled Kubernetes
- **[Multi-VM Applications](multi-vm.md)** - Multi-node architectures
- **[Linux Templates](linux.md)** - Linux base configurations

## Next Steps

1. **Deploy** applications to your cluster
2. **Configure** monitoring and alerting
3. **Implement** GitOps workflows
4. **Scale** cluster based on workload needs