# Kubernetes on Ubuntu Server 22.04 LTS

This guide will walk you through the process of setting up a Kubernetes cluster on a bare-metal server running Ubuntu Server 22.04 LTS using Kubespray.

This guide is specially designed to install a single-node Kubernetes cluster. 

## Quickstart

On a fresh installation of Ubuntu Server 22.04 LTS, mount a USB drive with the contents of this repository and run the bootstrap script:

```bash
# Ensure you're root
sudo su

# Run the boostrap script (replace /path/to/usb with the path to the USB drive)
bash /path/to/usb/bootstrap_k8s.sh
```

## Steps

### Preparing the Server

1. Install Ubuntu Server 22.04 LTS on the target machine using a bootable USB drive.

2. Copy the contents of this repository onto another USB drive.

3. Follow the installation prompts and prepare the server for the next steps. 

<br>
Once the server is up and running, open a shell and run the following commands.
<br>
<br>

4. Install the latest updates:

```bash
sudo apt update -y
sudo apt upgrade -y
```

4. Install the `linux-modules-extra` package. Required as Kubespray depends on modprobe to load kernel modules:

```bash
sudo apt-get install -y linux-modules-extra-$(uname -r)
```

### Installing Kubernetes with Kubespray (Ansible)

The following steps are to be completed on the target server, as requested.

<br>

> [!CAUTION]
> The following installation must be run under the **root user**.

<br>

1. Elevate to root:

```bash
sudo su
```

2. Install Python3. Kubespray uses Ansible, which is build upon Python.

```bash
apt install python3-pip -y

# Upgrade to the latest version of pip
pip3 install --upgrade pip
```

3. Install helm for deploying applications to the Kubernetes cluster later:

```bash
snap install helm --classic
```

4. Clone the Kubespray repository and checkout to the latest release:

```bash
git clone https://github.com/kubernetes-sigs/kubespray.git

cd kubespray
git checkout v2.24.1
```

5. Preparing the Kubesray install:

```bash
pip install -U -r requirements.txt
```


6. Add the ~/.local/bin to PATH environment variable:

```bash
export PATH=$PATH:~/.local/bin
```

7. Configuring Kubespray installer:

```bash
# Clone the sample inventory
cp -rfp inventory/sample inventory/mycluster

# Prepare inventory file
cat > inventory/mycluster/inventory.ini <<EOF
[all]
node1 ansible_connection=local

[kube_control_plane]
node1

[etcd]
node1

[kube_node]
node1

[k8s_cluster:children]
kube_control_plane
kube_node
EOF
```

8. Install Kubernetes by running the Ansible playbook:

```bash
ansible-playbook -i inventory/mycluster/inventory.ini  --become --become-user=root cluster.yml
```


<br>

<span style="font-size:2em;">🎉🎉🎉</span> <br><br>The installation will take about 10-20 mins to complete. Once done, you will have a Kubernetes cluster running on the target server.

<br>



### Verifying the Installation

Once the playbook has completed, you can verify the installation by running the following commands.

<br>

> [!IMPORTANT]
> As we completed the installation under the `root` user, Kubespray generated a `kubeconfig` file under the users home directory, so you will need to use the `root` user.
>
> For other users, use `sudo` to run the commands.

<br>

1. Test the connection to the cluster using `kubectl`

```bash
kubectl get nodes
```

You should see the following output:

```bash
NAME    STATUS   ROLES           AGE   VERSION
node1   Ready    control-plane   6m   v1.28.6
```

2. Verify all pods are in a running and healthy state:

```bash
kubectl get pods --all-namespaces
```

You should see the following output:

```bash
NAMESPACE     NAME                                      READY   STATUS    RESTARTS   AGE
kube-system   calico-kube-controllers-648dffd99-bqpj8   1/1     Running   0          8m52s
kube-system   calico-node-gbn94                         1/1     Running   0          9m19s
kube-system   coredns-77f7cc69db-ztfhn                  1/1     Running   0          8m28s
kube-system   dns-autoscaler-595558c478-g7rrg           1/1     Running   0          8m20s
kube-system   kube-apiserver-node1                      1/1     Running   1          10m
kube-system   kube-controller-manager-node1             1/1     Running   3          10m
kube-system   kube-proxy-rkm7d                          1/1     Running   0          9m41s
kube-system   kube-scheduler-node1                      1/1     Running   1          10m
kube-system   nodelocaldns-qddsn                        1/1     Running   0          8m20s
```

### Next steps

You can now start deploying applications to your Kubernetes cluster. For this delivery, we will be deploying the following applications:

- Rancher Longhorn - Required to allow Kubernetes to use local disk for storage volumes
- MongoDB
- HiveMQ Broker
- HiveMQ Listener

<br>

Before proceeding, change directories into the root of this repository. 

```bash
cd /path/to/usb
cd kubernetes-bare-metal
```

#### Installing Rancher Longhorn

```bash
helm upgrade --install longhorn ./kubernetes/manifests/longhorn --values ./kubernetes/manifests/longhorn/values.yaml
```


#### Installing MongoDB

```bash
helm upgrade --install mongodb ./kubernetes/manifests/mongodb --values ./kubernetes/manifests/mongodb/values.yaml
```

#### Installing HiveMQ Broker

```bash

```


## Dependencies

### Network Dependencies

The following is a list of network dependencies required for the installation. If the target environment has egress restrictions, ensure the following urls are whitelisted:

- https://dl.k8s.io
- https://github.com
- https://storage.googleapis.com
- https://get.helm.sh



-------
-------
-------
-------
-------






2. Once the server is up and running, you will need



0. Ensure server has the minimum requirements - [Link to Kubespray and Kubernetes min-reqs]


> [!NOTE]
> asdasd


1. Install Ubuntu Server 22.04 LTS on the target machine.

  - Install OpenSSH
  - Configure Public Keys for SSH access

2. Open serial console for server 

Upgrade packages:

```bash
sudo apt update -y
sudo apt upgrade -y

sudo apt-get install -y linux-modules-extra-$(uname -r) openvswitch-switch-dpdk
```

Disable sudo password prompt:

```bash
sudo visudo
```

Add the following line to the end of the file:

```bash
ubuntu ALL=(ALL) NOPASSWD: ALL
```

Find network interface:

```bash
ip a show

# 1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
#     link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
#     inet 127.0.0.1/8 scope host lo
#        valid_lft forever preferred_lft forever
#     inet6 ::1/128 scope host
#        valid_lft forever preferred_lft forever
# 2: enp0s15: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
#     link/ether 00:25:11:8e:86:f4 brd ff:ff:ff:ff:ff:ff
#     inet 192.168.1.116/24 metric 100 brd 192.168.1.255 scope global dynamic enp0s15
#        valid_lft 85681sec preferred_lft 85681sec
#     inet6 fe80::225:11ff:fe8e:86f4/64 scope link
#        valid_lft forever preferred_lft forever
```

In this case, the network interface is `enp0s15` and the ip address is `192.168.1.116`.

Edit the netplan configuration file:

```bash
sudo vim /etc/netplan/00-installer-config.yaml
```

Before:

```yaml
# This is the network config written by 'subiquity'
network:
  ethernets:
    enp0s15:
      dhcp4: true
  version: 2
```

After:

```yaml
network:
  renderer: networkd
  ethernets:
    enp0s15:
      addresses:
        - 192.168.1.116/24
      nameservers:
        addresses: [1.1.1.1,8.8.8.8]
      routes:
        - to: default
          via: 192.168.1.1
  version: 2
```

Apply the network configuration:

```bash
sudo netplan apply
```

> Take note of the ip address of the server. We'll use this in the next step


3. Installing Kubespray

The following steps will be completed on the local machine. This local machine must have network connectivity to the target server and have their public key added to the target server.

Ensure you have the following installed on your local machine:
- Python 3
- Ansible


Clone the Kubespray repository:

```bash
git clone https://github.com/kubernetes-sigs/kubespray.git
```

Go into the repo directory and checkout to the latest release:

```bash
cd kubespray
git checkout v2.24.1
```

Preparing the Kubesray install:

```bash
VENVDIR=kubespray-venv
KUBESPRAYDIR=kubespray
python3 -m venv $VENVDIR
source $VENVDIR/bin/activate
pip install -U -r requirements.txt
```

Copy the sample inventory file, then add the ip address of the target server:

```bash
# Copy the sample inventory
cp -rfp inventory/sample inventory/mycluster

# Declare the target server ip address 
declare -a IPS=(192.168.1.116)

# Update the inventory file with the target server ip address
CONFIG_FILE=inventory/mycluster/hosts.yaml python3 contrib/inventory_builder/inventory.py ${IPS[@]}
```

Edit the generated inventory file `inventory/mycluster/hosts.yaml` to include the `ansible_user` configuration.

```bash
all:
  hosts:
    node1:
      ansible_host: 192.168.1.116
      ansible_user: ubuntu
...
```

Change `ubuntu` to the user you use to ssh into the target server.

Run the Ansible Playbook:

```bash
ansible-playbook -i inventory/mycluster/hosts.yaml  --become --become-user=root cluster.yml
```


----

Configuring MetalLB

MetalLB hooks into your Kubernetes cluster, and provides a network load-balancer implementation. It allows you to create Kubernetes services of type "LoadBalancer" in clusters that don't run on a cloud provider, and thus cannot simply hook into 3rd party products to provide load-balancers. The default operating mode of MetalLB is in "Layer2" but it can also operate in "BGP" mode.

**Prerequisites**

Located under `inventory/mycluster/group_vars/k8s_cluster/k8s-cluster.yml`:

You have to configure arp_ignore and arp_announce to avoid answering ARP queries from kube-ipvs0 interface for MetalLB to work.

```yaml
kube_proxy_strict_arp: true
```
**Install**

You have to explicitly enable the MetalLB extension.

```yaml
metallb_enabled: true
metallb_speaker_enabled: true
```

By default only the MetalLB BGP speaker is allowed to run on control plane nodes. If you have a single node cluster or a cluster where control plane are also worker nodes you may need to enable tolerations for the MetalLB controller:

```yaml
metallb_config:
  controller:
    nodeselector:
      kubernetes.io/os: linux
    tolerations:
    - key: "node-role.kubernetes.io/control-plane"
      operator: "Equal"
      value: ""
      effect: "NoSchedule"
```


Specify all of the pools you are going to use:

```yaml
metallb_config:
  address_pools:
    primary:
      ip_range:
        - 192.168.1.200-192.168.1.254
  layer2:
    - primary
```


End result:

[Screenshot]

----

Configuring Storage

https://github.com/kubernetes-sigs/kubespray/blob/master/docs/kubernetes-apps/local_volume_provisioner.md


```yaml
local_volume_provisioner_enabled: true
local_volume_provisioner_storage_classes:
  local-storage:
    host_dir: /mnt/disks
    mount_dir: /mnt/disks
```

[Screenshot]

---


Metrics Server

```yaml
metrics_server_enabled: true
```


SSH into our control plan server:

```bash
ssh ubuntu@
```

Copy the kubeconfig file:

```bash
ssh ubuntu@192.168.1.116 "sudo cat /etc/kubernetes/admin.conf" > ./kubeconfig
```

Open the kubeconfig file and change the server address to the ip address of the control plane server:


Before:

```yaml
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: **********
    server: https://127.0.0.1:6443
  name: cluster.local
```

After: 

```yaml
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: **********
    server: https://192.168.1.116:6443
  name: cluster.local
```

Configure your kubectl to use the kubeconfig file:

```bash
export KUBECONFIG=$(pwd)/kubeconfig
```

Validate the connection to the cluster:

```bash
kubectl get nodes

# NAME    STATUS   ROLES           AGE   VERSION
# node1   Ready    control-plane   69m   v1.28.6
```


----

Test deployment

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml
```


kubectl create deployment demo --image=httpd --port=80
kubectl expose deployment demo

kubectl create ingress demo-localhost --class=nginx --rule="demo.local/*=demo:80"


------

Storage: Longhorn

```bash
helm upgrade --install longhorn ./kubernetes/manifests/longhorn --values ./kubernetes/manifests/longhorn/values.yaml
```


-- 

Deployment

MongoDb:

helm upgrade --install mongodb ./kubernetes/manifests/mongodb --values ./kubernetes/manifests/mongodb/values.yaml
















------------





Troubleshooting:

If you get the Ansible error: 'fatal: [node1]: FAILED! => {"msg": "Missing sudo password"}'

```
TASK [bootstrap-os : Fetch /etc/os-release] *********************************************************************************************************************************
fatal: [node1]: FAILED! => {"msg": "Missing sudo password"}
```

Re-run with the `-kK` flags:

```bash
ansible-playbook -i inventory/mycluster/hosts.yaml  --become --become-user=root cluster.yml -kK
```

When prompted, enter `SSH password`. If no passphrase is configured for your SSH key, leave it empty and press enter.

When prompted, enter `BECOME password`. Enter the password for the `ubuntu` user on the target server. 

```bash
➜ ansible-playbook -i inventory/mycluster/hosts.yaml  --become --become-user=root cluster.yml -kK
SSH password: 
BECOME password[defaults to SSH password]:
```







```bash
ssh ubuntu@192.168.1.116
```

Updates 
```bash
sudo apt update -y
sudo apt upgrade -y
```

3. 

