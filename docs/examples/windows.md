# Windows Templates

This section demonstrates Windows-based virtual machine templates and configurations using Kraken manifests. These examples show how to create, configure, and deploy Windows VMs for enterprise and development environments.

## Overview

Windows templates in Kraken provide:

- **Enterprise Windows** Server and Desktop deployments
- **TPM support** for Windows security features
- **Template VMs** for rapid deployment
- **Cloud-init integration** for automated setup
- **Active Directory** integration capabilities

## Windows Server Template

This example creates a Windows Server template VM ready for enterprise deployment.

### Windows Server Configuration

```yaml title="windows-server-template.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "windows-server-template"
  labels:
    - "os:windows"
    - "type:template"
    - "edition:server"
spec:
  assets:
    - name: "windows-server-2022"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/windows-server-2022.img"
  
  resources:
    - type: "virdomain"
      name: "windows-server-template"
      spec:
        description: "Windows Server 2022 template for enterprise deployment"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "tpm"  # TPM required for Windows security
        
        storage_devices:
          - name: "system-disk"
            type: "virtio_disk"
            source: "windows-server-2022"
            boot: 1
            capacity: 107374182400  # 100 GB
        
        network_devices:
          - name: "ethernet"
            type: "virtio"
        
        tags:
          - "windows"
          - "server"
          - "template"
          - "enterprise"
        
        state: "shutoff"  # Template state for cloning
```

### Key Features

- **TPM Machine Type**: Required for Windows security features
- **8GB RAM**: Adequate for Windows Server workloads
- **100GB Storage**: Space for OS, applications, and data
- **VirtIO Network**: High-performance networking
- **Template State**: Ready for cloning

## Windows Desktop Development

Windows desktop environment for development and testing.

### Windows Desktop Manifest

```yaml title="windows-desktop-dev.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "windows-desktop-{{ user_id }}"
  labels:
    - "os:windows"
    - "purpose:development"
    - "edition:desktop"
spec:
  assets:
    - name: "windows-11-pro"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/windows-11-pro.img"
  
  resources:
    - type: "virdomain"
      name: "windows-dev-{{ user_id }}"
      spec:
        description: "Windows 11 Pro development environment"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "tpm"
        
        storage_devices:
          - name: "system-disk"
            type: "virtio_disk"
            source: "windows-11-pro"
            boot: 1
            capacity: 128849018880  # 120 GB
          - name: "data-disk"
            type: "virtio_disk"
            capacity: 214748364800  # 200 GB
        
        network_devices:
          - name: "ethernet"
            type: "virtio"
        
        tags:
          - "windows"
          - "desktop"
          - "development"
          - "visual-studio"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            # Windows cloud-init configuration
            users:
              - name: developer
                primary_group: Users
                groups: [Administrators, "Remote Desktop Users"]
                passwd: SecurePassword123!
                lock_passwd: false
            
            # Install Chocolatey package manager
            runcmd:
              - powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
              
              # Install development tools
              - choco install -y git
              - choco install -y vscode
              - choco install -y nodejs
              - choco install -y python
              - choco install -y docker-desktop
              - choco install -y postman
              - choco install -y 7zip
              - choco install -y notepadplusplus
              
              # Configure Windows features
              - dism /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
              - dism /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
              
              # Configure PowerShell execution policy
              - powershell -Command "Set-ExecutionPolicy RemoteSigned -Force"
          
          meta_data: |
            instance-id: windows-dev-{{ user_id }}
            local-hostname: windows-dev-{{ user_id }}
```

## Active Directory Domain Controller

Windows Server configured as an Active Directory Domain Controller.

### AD Domain Controller Manifest

```yaml title="ad-domain-controller.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "ad-domain-controller"
  labels:
    - "os:windows"
    - "role:domain-controller"
    - "service:active-directory"
spec:
  assets:
    - name: "windows-server-2022-dc"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/windows-server-2022-dc.img"
  
  resources:
    - type: "virdomain"
      name: "ad-domain-controller"
      spec:
        description: "Windows Server 2022 Active Directory Domain Controller"
        cpu: 4
        memory: "8589934592"  # 8 GB
        machine_type: "tpm"
        
        storage_devices:
          - name: "system-disk"
            type: "virtio_disk"
            source: "windows-server-2022-dc"
            boot: 1
            capacity: 107374182400  # 100 GB
          - name: "ad-database"
            type: "virtio_disk"
            capacity: 53687091200  # 50 GB for AD database
        
        network_devices:
          - name: "domain-network"
            type: "virtio"
        
        tags:
          - "windows"
          - "domain-controller"
          - "active-directory"
          - "dns"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            # Configure Domain Controller
            runcmd:
              # Install AD DS role
              - powershell -Command "Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools"
              
              # Configure static IP (adjust for your network)
              - powershell -Command "New-NetIPAddress -InterfaceIndex 12 -IPAddress 192.168.1.10 -PrefixLength 24 -DefaultGateway 192.168.1.1"
              - powershell -Command "Set-DnsClientServerAddress -InterfaceIndex 12 -ServerAddresses 127.0.0.1"
              
              # Install AD Forest
              - powershell -Command "Install-ADDSForest -DomainName 'company.local' -SafeModeAdministratorPassword (ConvertTo-SecureString 'P@ssw0rd123!' -AsPlainText -Force) -Force"
              
              # Configure DNS
              - powershell -Command "Add-DnsServerPrimaryZone -Name 'company.local' -ZoneFile 'company.local.dns'"
              
              # Add DNS forwarders
              - powershell -Command "Add-DnsServerForwarder -IPAddress 8.8.8.8"
              - powershell -Command "Add-DnsServerForwarder -IPAddress 8.8.4.4"
          
          meta_data: |
            instance-id: ad-domain-controller-001
            local-hostname: dc01
```

## IIS Web Server

Windows Server configured with Internet Information Services (IIS).

### IIS Web Server Manifest

```yaml title="iis-web-server.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "iis-web-server-{{ instance_id }}"
  labels:
    - "os:windows"
    - "role:web-server"
    - "service:iis"
spec:
  assets:
    - name: "windows-server-2022"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/windows-server-2022.img"
  
  resources:
    - type: "virdomain"
      name: "iis-web-{{ instance_id }}"
      spec:
        description: "Windows Server 2022 with IIS web server"
        cpu: 2
        memory: "4294967296"  # 4 GB
        machine_type: "tpm"
        
        storage_devices:
          - name: "system-disk"
            type: "virtio_disk"
            source: "windows-server-2022"
            boot: 1
            capacity: 85899345920  # 80 GB
          - name: "web-content"
            type: "virtio_disk"
            capacity: 42949672960  # 40 GB for web content
        
        network_devices:
          - name: "web-network"
            type: "virtio"
        
        tags:
          - "windows"
          - "iis"
          - "web-server"
          - "dotnet"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            runcmd:
              # Install IIS and ASP.NET
              - powershell -Command "Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpRedirect, IIS-ApplicationDevelopment, IIS-NetFxExtensibility45, IIS-HealthAndDiagnostics, IIS-HttpLogging, IIS-Security, IIS-RequestFiltering, IIS-Performance, IIS-WebServerManagementTools, IIS-ManagementConsole, IIS-IIS6ManagementCompatibility, IIS-Metabase, IIS-ASPNET45 -All"
              
              # Configure IIS
              - powershell -Command "Import-Module WebAdministration"
              - powershell -Command "New-Website -Name 'Default Web Site' -Port 80 -PhysicalPath 'C:\\inetpub\\wwwroot'"
              
              # Install .NET Framework
              - powershell -Command "Install-WindowsFeature -Name NET-Framework-45-Features"
              
              # Configure firewall
              - powershell -Command "New-NetFirewallRule -DisplayName 'Allow HTTP' -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow"
              - powershell -Command "New-NetFirewallRule -DisplayName 'Allow HTTPS' -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow"
              
              # Create sample web page
              - powershell -Command "Set-Content -Path 'C:\\inetpub\\wwwroot\\index.html' -Value '<html><body><h1>IIS Server Running</h1><p>Server: {{ instance_id }}</p></body></html>'"
          
          meta_data: |
            instance-id: iis-web-{{ instance_id }}
            local-hostname: iis-web-{{ instance_id }}
```

## SQL Server Database

Windows Server with SQL Server for database workloads.

### SQL Server Manifest

```yaml title="sql-server.yaml"
type: Application
version: "1.0.0"
metadata:
  name: "sql-server-{{ instance_id }}"
  labels:
    - "os:windows"
    - "database:sql-server"
    - "tier:data"
spec:
  assets:
    - name: "windows-server-sql"
      type: "virtual_disk"
      format: "raw"
      url: "https://storage.googleapis.com/demo-bucket/windows-server-2022-sql.img"
  
  resources:
    - type: "virdomain"
      name: "sql-server-{{ instance_id }}"
      spec:
        description: "Windows Server 2022 with SQL Server"
        cpu: 4
        memory: "17179869184"  # 16 GB
        machine_type: "tpm"
        
        storage_devices:
          - name: "system-disk"
            type: "virtio_disk"
            source: "windows-server-sql"
            boot: 1
            capacity: 107374182400  # 100 GB
          - name: "data-disk"
            type: "virtio_disk"
            capacity: 214748364800  # 200 GB for databases
          - name: "log-disk"
            type: "virtio_disk"
            capacity: 107374182400  # 100 GB for logs
        
        network_devices:
          - name: "sql-network"
            type: "virtio"
        
        tags:
          - "windows"
          - "sql-server"
          - "database"
          - "enterprise"
        
        state: "running"
        
        cloud_init_data:
          user_data: |
            #cloud-config
            runcmd:
              # Configure SQL Server data directories
              - powershell -Command "New-Item -ItemType Directory -Path 'E:\\SQLData' -Force"
              - powershell -Command "New-Item -ItemType Directory -Path 'F:\\SQLLogs' -Force"
              
              # Format additional disks
              - powershell -Command "Initialize-Disk -Number 1 -PartitionStyle MBR -PassThru | New-Partition -UseMaximumSize -AssignDriveLetter | Format-Volume -FileSystem NTFS -NewFileSystemLabel 'SQLData' -Confirm:$false"
              - powershell -Command "Initialize-Disk -Number 2 -PartitionStyle MBR -PassThru | New-Partition -UseMaximumSize -AssignDriveLetter | Format-Volume -FileSystem NTFS -NewFileSystemLabel 'SQLLogs' -Confirm:$false"
              
              # Configure SQL Server service
              - powershell -Command "Set-Service -Name 'MSSQLSERVER' -StartupType Automatic"
              - powershell -Command "Start-Service -Name 'MSSQLSERVER'"
              
              # Configure SQL Server Agent
              - powershell -Command "Set-Service -Name 'SQLSERVERAGENT' -StartupType Automatic"
              - powershell -Command "Start-Service -Name 'SQLSERVERAGENT'"
              
              # Configure firewall for SQL Server
              - powershell -Command "New-NetFirewallRule -DisplayName 'SQL Server' -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow"
          
          meta_data: |
            instance-id: sql-server-{{ instance_id }}
            local-hostname: sql-server-{{ instance_id }}
```

## Common Windows Patterns

### User Management

```yaml
# Create local users
users:
  - name: serviceaccount
    primary_group: Users
    groups: [Users, "Log on as a service"]
    passwd: ComplexPassword123!
    lock_passwd: false

# Configure Administrator
runcmd:
  - net user Administrator NewPassword123! /active:yes
```

### Windows Features

```yaml
# Enable Windows features
runcmd:
  - dism /online /enable-feature /featurename:IIS-WebServerRole /all /norestart
  - dism /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
  - powershell -Command "Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All"
```

### Package Management

```yaml
# Install Chocolatey and packages
runcmd:
  - powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))"
  - choco install -y git
  - choco install -y vscode
  - choco install -y nodejs
```

### Service Configuration

```yaml
# Configure Windows services
runcmd:
  - sc config "ServiceName" start= auto
  - net start "ServiceName"
  - sc description "ServiceName" "Service description"
```

## Best Practices

### 1. Security Configuration

```yaml
# Security hardening
runcmd:
  - powershell -Command "Set-ExecutionPolicy RemoteSigned -Force"
  - powershell -Command "Enable-WindowsOptionalFeature -Online -FeatureName Windows-Defender-Features -All"
  - powershell -Command "Set-MpPreference -DisableRealtimeMonitoring $false"
```

### 2. Resource Planning

```yaml
# Appropriate Windows sizing
cpu: 4                    # Minimum for server workloads
memory: "8589934592"      # 8GB minimum for Windows Server
capacity: 107374182400    # 100GB minimum for Windows + apps
```

### 3. TPM Configuration

```yaml
# Always use TPM for Windows VMs
machine_type: "tpm"  # Required for Windows security features
```

### 4. Storage Layout

```yaml
# Separate system and data storage
storage_devices:
  - name: "system-disk"     # OS and applications
    capacity: 107374182400  # 100GB
  - name: "data-disk"       # Application data
    capacity: 214748364800  # 200GB
```

## Troubleshooting

### Common Issues

1. **Boot failures**: Ensure TPM machine type is used
2. **Activation issues**: Check Windows licensing
3. **Driver problems**: Verify VirtIO driver installation
4. **Network connectivity**: Check Windows firewall settings

### Debug Commands

```powershell
# Check Windows activation
slmgr /xpr

# Check system information
systeminfo

# Check services
Get-Service | Where-Object {$_.Status -eq "Running"}

# Check event logs
Get-EventLog -LogName System -Newest 50
```

## Related Examples

- **[Multi-VM Applications](multi-vm.md)** - Windows and Linux together
- **[Basic Examples](basic.md)** - Fundamental configurations
- **[GPU Applications](gpu.md)** - Windows with GPU support

## Next Steps

1. **Customize** templates for your organization
2. **Implement** domain joining procedures
3. **Configure** monitoring and backup
4. **Scale** to enterprise deployments