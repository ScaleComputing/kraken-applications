# Kubernetes

This section demonstrates Kubernetes deployment using Kraken manifests. The example shows how to deploy a single-node K3s cluster with monitoring stack, based on the actual `single-node-k3s/manifest.yaml` in this repository.

## Overview

Kubernetes applications in Kraken provide:

- **Single-node K3s clusters** with monitoring
- **Automated K3s installation** via cloud-init
- **Built-in monitoring stack** (Prometheus, Grafana, Node Exporter)
- **Production-ready configuration** with proper resource allocation

## Single-Node K3s Cluster

This example deploys a complete single-node Kubernetes cluster using K3s with a comprehensive monitoring stack. The manifest is based on the actual `single-node-k3s/manifest.yaml` in this repository.

### K3s Single-Node Manifest

```yaml title="single-node-k3s/manifest.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "k3s-single-node-demo"
  labels:
    - k3s
    - single-node
    - pytest
spec:
  assets:
    - name: ubuntu_k3s_base
      type: virtual_disk
      format: raw
      url: "https://storage.googleapis.com/demo-bucket-lfm/focal-server-cloudimg-amd64.img"
  
  resources:
    - type: virdomain
      name: "k3s-controlplane-schedulable-demo"
      spec:
        description: Single-node k3s cluster
        cpu: 2
        memory: "4294967296"  # 4 GB
        machine_type: "uefi"
        
        storage_devices:
          - name: disk1
            type: virtio_disk
            source: "ubuntu_k3s_base"
            boot: 1
            capacity: 10000000000  # 10 GB
        
        network_devices:
          - name: eth0
            type: virtio
        
        tags:
          - pytest
          - k3s
          - single-node
        
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
              - open-iscsi
              - nfs-common
              - cloud-guest-utils
              - gdisk
            
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
            
            # Create admin user
            users:
              - name: admin
                primary_group: admin
                plain_text_passwd: 'testpassword123'
                lock_passwd: false
                shell: /bin/bash
                sudo: ALL=(ALL) NOPASSWD:ALL
                ssh_import_id: ["gh:haljac"]
                groups: sudo, adm
            
            runcmd:
              # Enable qemu-guest-agent
              - systemctl enable qemu-guest-agent
              - systemctl start qemu-guest-agent
              - systemctl status qemu-guest-agent
              
              # Configure kernel parameters for k3s
              - echo "net.ipv4.ip_forward = 1" > /etc/sysctl.d/90-k3s.conf
              - echo "net.bridge.bridge-nf-call-iptables = 1" >> /etc/sysctl.d/90-k3s.conf
              - echo "net.bridge.bridge-nf-call-ip6tables = 1" >> /etc/sysctl.d/90-k3s.conf
              - sysctl -p /etc/sysctl.d/90-k3s.conf
              
              # Install k3s as a single-node cluster
              - curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644
              
              # Verify k3s is running
              - sleep 30
              - kubectl get nodes
            
            # Monitoring stack deployment
            write_files:
              - path: /var/lib/rancher/k3s/server/manifests/monitoring-stack.yaml
                content: |
                  apiVersion: v1
                  kind: Namespace
                  metadata:
                    name: monitoring
                  ---
                  # RBAC for Prometheus
                  apiVersion: rbac.authorization.k8s.io/v1
                  kind: ClusterRole
                  metadata:
                     name: prometheus-monitoring
                  rules:
                  - apiGroups: [""]
                    resources:
                    - nodes
                    - nodes/proxy
                    - services
                    - endpoints
                    - pods
                    verbs: ["get", "list", "watch"]
                  - apiGroups:
                    - extensions
                    resources:
                    - ingresses
                    verbs: ["get", "list", "watch"]
                  - nonResourceURLs: ["/metrics"]
                    verbs: ["get"]
                  ---
                  apiVersion: v1
                  kind: ServiceAccount
                  metadata:
                    name: prometheus-monitoring
                    namespace: monitoring
                  ---
                  apiVersion: rbac.authorization.k8s.io/v1
                  kind: ClusterRoleBinding
                  metadata:
                    name: prometheus-monitoring
                  roleRef:
                    apiGroup: rbac.authorization.k8s.io
                    kind: ClusterRole
                    name: prometheus-monitoring
                  subjects:
                  - kind: ServiceAccount
                    name: prometheus-monitoring
                    namespace: monitoring
                  ---
                  # Node Exporter DaemonSet
                  apiVersion: apps/v1
                  kind: DaemonSet
                  metadata:
                    name: node-exporter
                    namespace: monitoring
                    labels:
                      app.kubernetes.io/name: node-exporter
                  spec:
                    selector:
                      matchLabels:
                        app.kubernetes.io/name: node-exporter
                    template:
                      metadata:
                        labels:
                          app.kubernetes.io/name: node-exporter
                      spec:
                        hostPID: true
                        hostNetwork: true
                        tolerations:
                        - operator: Exists
                        containers:
                        - name: node-exporter
                          image: prom/node-exporter:v1.7.0
                          args:
                            - '--path.procfs=/host/proc'
                            - '--path.sysfs=/host/sys'
                            - '--path.rootfs=/host/root'
                            - '--web.listen-address=:9100'
                          ports:
                          - containerPort: 9100
                            protocol: TCP
                            name: metrics
                            hostPort: 9100
                          resources:
                            requests:
                              cpu: 100m
                              memory: 30Mi
                            limits:
                              cpu: 200m
                              memory: 50Mi
                          volumeMounts:
                          - name: proc
                            mountPath: /host/proc
                            readOnly: true
                          - name: sys
                            mountPath: /host/sys
                            readOnly: true
                          - name: rootfs
                            mountPath: /host/root
                            readOnly: true
                        volumes:
                        - name: proc
                          hostPath:
                            path: /proc
                        - name: sys
                          hostPath:
                            path: /sys
                        - name: rootfs
                          hostPath:
                            path: /
                  ---
                  # Prometheus Deployment
                  apiVersion: apps/v1
                  kind: Deployment
                  metadata:
                    name: prometheus
                    namespace: monitoring
                    labels:
                      app.kubernetes.io/name: prometheus
                  spec:
                    replicas: 1
                    selector:
                      matchLabels:
                        app.kubernetes.io/name: prometheus
                    template:
                      metadata:
                        labels:
                          app.kubernetes.io/name: prometheus
                      spec:
                        serviceAccountName: prometheus-monitoring
                        containers:
                        - name: prometheus
                          image: prom/prometheus:v2.51.1
                          args:
                            - '--config.file=/etc/prometheus/prometheus.yml'
                            - '--storage.tsdb.path=/prometheus'
                            - '--web.console.libraries=/usr/share/prometheus/console_libraries'
                            - '--web.console.templates=/usr/share/prometheus/consoles'
                            - '--web.enable-lifecycle'
                          ports:
                          - containerPort: 9090
                            name: web
                          volumeMounts:
                          - name: config-volume
                            mountPath: /etc/prometheus
                          - name: data-volume
                            mountPath: /prometheus
                        volumes:
                        - name: config-volume
                          configMap:
                            name: prometheus-config
                        - name: data-volume
                          emptyDir: {}
                  ---
                  # Grafana Deployment
                  apiVersion: apps/v1
                  kind: Deployment
                  metadata:
                    name: grafana
                    namespace: monitoring
                    labels:
                      app.kubernetes.io/name: grafana
                  spec:
                    replicas: 1
                    selector:
                      matchLabels:
                        app.kubernetes.io/name: grafana
                    template:
                      metadata:
                        labels:
                          app.kubernetes.io/name: grafana
                      spec:
                        containers:
                        - name: grafana
                          image: grafana/grafana:10.4.2
                          ports:
                          - containerPort: 3000
                            name: http
                          env:
                            - name: GF_SECURITY_ADMIN_USER
                              value: admin
                            - name: GF_SECURITY_ADMIN_PASSWORD
                              value: admin
                          volumeMounts:
                          - name: datasources
                            mountPath: /etc/grafana/provisioning/datasources
                          - name: storage
                            mountPath: /var/lib/grafana
                        volumes:
                        - name: datasources
                          configMap:
                            name: grafana-datasources
                        - name: storage
                          emptyDir: {}
                  ---
                  # Grafana Service (NodePort for external access)
                  apiVersion: v1
                  kind: Service
                  metadata:
                    name: grafana
                    namespace: monitoring
                  spec:
                    type: NodePort
                    selector:
                      app.kubernetes.io/name: grafana
                    ports:
                    - name: http
                      port: 3000
                      targetPort: http
                      nodePort: 32000  # Access via node-ip:32000
          
          meta_data: |
            instance-id: k3s-single-node-demo
            local-hostname: k3s-controlplane-schedulable-demo
```

### Key Features

This manifest demonstrates comprehensive Kubernetes deployment:

#### K3s Installation
- **Automated installation**: Uses the official K3s installer script
- **Single-node cluster**: Control plane with scheduling enabled
- **Kernel configuration**: Sets required networking parameters
- **Kubeconfig access**: World-readable for easy access

#### Monitoring Stack
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization dashboard (admin/admin)
- **Node Exporter**: System metrics collection
- **RBAC**: Proper security permissions

#### Resource Configuration
- **4 GB RAM**: Adequate for K3s and monitoring
- **2 CPU cores**: Sufficient for single-node operation
- **10 GB storage**: Minimal but functional

#### Security and Access
- **SSH key import**: GitHub integration for key management
- **User management**: Admin user with sudo access
- **Password access**: For initial connection

## Accessing the Cluster

After deployment, you can access the K3s cluster:

1. **SSH Access**: `ssh admin@vm-ip` (password: `testpassword123`)
2. **Kubectl**: Commands work directly on the node
3. **Grafana Dashboard**: `http://vm-ip:32000` (admin/admin)
4. **Prometheus**: Available within cluster

### Kubectl Examples

```bash
# Check cluster status
kubectl get nodes

# View running pods
kubectl get pods --all-namespaces

# Check monitoring namespace
kubectl get pods -n monitoring

# View services
kubectl get services -n monitoring
```

## GPU-Enabled Kubernetes {#gpu-cluster}

For GPU workloads, you can extend the K3s deployment with GPU support. While not included in the base repository examples, you can combine patterns from the YOLO GPU example with K3s:

### Resource Scaling for GPU

```yaml
# Increase resources for GPU workloads
cpu: 8
memory: "17179869184"  # 16 GB
machine_type: "bios"   # Often better for GPU VMs

# Add GPU-specific packages
packages:
  - nvidia-driver-525
  - nvidia-container-toolkit
```

## Configuration Options

### Resource Scaling

```yaml
# Minimal development
cpu: 2
memory: "4294967296"   # 4 GB
capacity: 10000000000  # 10 GB

# Production single-node
cpu: 4
memory: "8589934592"   # 8 GB  
capacity: 53687091200  # 50 GB

# High-performance
cpu: 8
memory: "17179869184"  # 16 GB
capacity: 107374182400 # 100 GB
```

### K3s Options

```yaml
# Custom K3s installation
runcmd:
  # Disable certain components
  - curl -sfL https://get.k3s.io | sh -s - --disable traefik --disable servicelb
  
  # Custom cluster configuration
  - curl -sfL https://get.k3s.io | sh -s - --cluster-cidr=10.42.0.0/16 --service-cidr=10.43.0.0/16
```

## Best Practices

### 1. Resource Planning

- **Memory**: 4 GB minimum for K3s + monitoring
- **Storage**: 10 GB minimum, 50 GB recommended
- **CPU**: 2 cores minimum for single-node

### 2. Monitoring Configuration

- **NodePort services**: Enable external access to dashboards
- **Resource limits**: Set appropriate limits for monitoring components
- **Persistent storage**: Consider persistent volumes for production

### 3. Security Considerations

- **Change default passwords**: Update Grafana admin password
- **SSH key management**: Use proper SSH keys in production
- **Network policies**: Implement Kubernetes network policies

### 4. Operational Excellence

- **Backup kubeconfig**: Save cluster access configuration
- **Monitor resource usage**: Use the included monitoring stack
- **Plan for scaling**: Consider multi-node clusters for production

## Troubleshooting

### Common Issues

1. **K3s installation fails**: Check network connectivity and DNS
2. **Pods won't start**: Check resource allocation and node capacity
3. **Monitoring not accessible**: Verify NodePort service configuration
4. **Storage issues**: Ensure adequate disk space

### Debug Commands

```bash
# Check K3s status
sudo systemctl status k3s

# View K3s logs
sudo journalctl -u k3s

# Check cluster resources
kubectl top nodes
kubectl top pods --all-namespaces

# Describe problematic pods
kubectl describe pod -n monitoring prometheus-xxx
```

## Related Examples

- **[GPU Applications](gpu.md)** - GPU-enabled container workloads
- **[Multi-VM Applications](multi-vm.md)** - Multi-node architectures
- **[Linux Templates](linux.md)** - Linux base configurations

## Next Steps

1. **Deploy** applications to your cluster
2. **Configure** persistent storage for production workloads
3. **Add** additional monitoring and alerting
4. **Scale** to multi-node clusters as needed
5. **Implement** GitOps workflows with ArgoCD or Flux