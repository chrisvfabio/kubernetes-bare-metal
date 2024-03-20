#!/bin/bash

KUBESPRAY_VERSION=v2.24.1

echo "🚀 Bootstrapping Kubernetes Cluster via Kubespray (Ansible)"
echo

echo "🔍 Checking for root privileges"
echo

if [ "$EUID" -ne 0 ]
  then echo "❌ Please run as root"
  exit
fi

echo
echo "📦 Installing latest updates & dependencies"
echo
apt update -y
apt upgrade -y
apt install -y linux-modules-extra-$(uname -r)

echo
echo "🐍 Installing python dependencies"

apt install -y python3-pip
pip3 install --upgrade pip

echo
echo "⚙️ Installing Helm"
snap install helm --classic
echo

echo
echo "☸️ Installing Kubespray"

git clone https://github.com/kubernetes-sigs/kubespray.git
cd kubespray
git checkout $KUBESPRAY_VERSION

# Install python packages
pip install -U -r requirements.txt

# Add python bin to PATH
export PATH=$PATH:~/.local/bin

# Prepare inventory
cp -rfp inventory/sample inventory/mycluster

# Configure Ansible inventory
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

echo
echo "⚡️ Running the Ansible Playbook. This will take some time. Grab a ☕️!"

ansible-playbook -i inventory/mycluster/inventory.ini  --become --become-user=root cluster.yml

echo
echo
echo "🎉 Kubernetes Cluster is ready! 🎉"
echo
echo

echo "🔑 To start using your cluster, run the following command:"
echo
echo
echo "kubectl get pods --all-namespaces"
echo
echo "🚀 Happy Kuberneting!"
echo


kubectl get nodes

