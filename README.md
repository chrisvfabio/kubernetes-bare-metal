# Kubernetes on Ubuntu Server 22.04 LTS (Bare-Metal)

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

Once the boostrap script is complete, skip to the application installation steps below.

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

### Installing Applications

You can now start deploying applications to your Kubernetes cluster. For this delivery, we will be deploying the following applications:

- Rancher Longhorn - Required to allow Kubernetes to use local disk for storage volumes
- MongoDB
- HiveMQ Broker
- HiveMQ Listener
- MetalLB to support LoadBalancer services (external access within the internal network)

<br>

> [!CAUTION]
> Before proceeding, please update the `kubernetes/manifests` images with the correct image names and tags. This documentation uses an example/demo image.

<br>

1. Adding the Image Pull Secret

Create an Image Pull secret which has the GitHub Packages credentials.

```bash
YOUR_GITHUB_USERNAME=chrisvfabio
YOUR_GITHUB_TOKEN="******"

kubectl create secret docker-registry ghcr-login-secret --docker-server=https://ghcr.io --docker-username=$YOUR_GITHUB_USERNAME --docker-password=$YOUR_GITHUB_TOKEN
```

2. Change directories into the root of this repository. 

```bash
cd /path/to/usb
cd kubernetes-bare-metal
```

3. Installing Rancher Longhorn. This will need to be installed before MongoDB as this deployment configure the `StorageClass` for the MongoDB deployment.
```bash
helm upgrade --install longhorn ./kubernetes/manifests/longhorn --values ./kubernetes/manifests/longhorn/values.yaml
```


4. Installing MongoDB in `standalone` mode.

Deploy helm chart.

```bash
helm upgrade --install mongodb ./kubernetes/manifests/mongodb --values ./kubernetes/manifests/mongodb/values.yaml
```

Once deployed and running, connect to the MongoDB instance and create a new database and user.

```bash
MONGODB_POD=$(kubectl get pods -l app.kubernetes.io/instance=mongodb -o jsonpath="{.items[0].metadata.name}")

kubectl exec $MONGODB_POD -it mongo
```

Create a user with root role.
```bash
use admin

# Create a user with root role - use a better password
db.createUser({user: "hivemq-listener", pwd: "supersecret", roles: ["root"]})
```

Exit from the interactive shell.

```bash
exit
```

5. Installing HiveMQ Broker

> [!TIP]
> Review the manifest files to ensure the correct image name and tag are used.

```bash
kubectl apply -R -f ./kubernetes/manifests/hivemq-broker
```

Check logs to ensure the app is healthy:

```bash
kubectl logs deploy/hivemq-broker
```

6. Installing HiveMQ Listener

> [!TIP]
> Review the manifest files to ensure the correct image name and tag are used.

```bash
kubectl apply -R -f ./kubernetes/manifests/hivemq-listener-node
```

Check logs to ensure the app is healthy:

```bash
kubectl logs deploy/hivemq-listener-node
```

7. Installing [MetalLB](https://github.com/metallb/metallb)

Configure `arp_ignore` and `arp_announce` to avoid answering ARP queries from kube-ipvs0 interface. This must be set to true for MetalLB, kube-vip(ARP enabled) to work.

```bash
kubectl get configmap kube-proxy -n kube-system -o yaml | \
sed -e "s/strictARP: false/strictARP: true/" | \
kubectl apply -f - -n kube-system
```

Install the MetalLB manifest:

```bash
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.14.3/config/manifests/metallb-native.yaml
```

Allocate a range of IP addresses for MetalLB to use:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: default
  namespace: metallb-system
spec:
  addresses:
  - 192.168.1.239-192.168.1.255
EOF
```

> [!NOTE]
> Ensure the above address range is within the same subnet as the server and reserved in DHCP.
> 
> You can find your address range by running `ip a` and looking for the `inet` address.
> 

Let's verify MetalLB is working by creating a sample nginx deployment and LoadBalancer service:

```bash
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --type=LoadBalancer --port 80
```

Run `kubectl get services` to see if an External IP is assigned. As you can see in the output below, MetalLB has assigned an external IP within the Address Pool specified earlier - `192.168.1.239`.

```bash
kubectl get services
NAME                          TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)        AGE
kubernetes                    ClusterIP      10.233.0.1      <none>          443/TCP        170m
longhorn-admission-webhook    ClusterIP      10.233.20.201   <none>          9502/TCP       50m
longhorn-backend              ClusterIP      10.233.32.175   <none>          9500/TCP       50m
longhorn-conversion-webhook   ClusterIP      10.233.47.6     <none>          9501/TCP       50m
longhorn-engine-manager       ClusterIP      None            <none>          <none>         50m
longhorn-frontend             ClusterIP      10.233.9.62     <none>          80/TCP         50m
longhorn-recovery-backend     ClusterIP      10.233.17.68    <none>          9503/TCP       50m
longhorn-replica-manager      ClusterIP      None            <none>          <none>         50m
mongodb                       ClusterIP      10.233.4.235    <none>          27017/TCP      50m
nginx                         LoadBalancer   10.233.25.248   192.168.1.239   80:30709/TCP   10m
```

Clean up nginx deployment and service:

```bash
kubectl delete deployment nginx
kubectl delete service nginx
```

### Testing the Applications

For this example, I'll publish a sample message into the HiveMQ Broker and monitor the HiveMQ Listener for logs to ensure the message is received, then I will check MongoDB (using MongoDB Compass) to ensure the message is stored.

To verify connectivity outside the cluster (say from another machine within the network), I'll expose the hivemq-broker deployment via a LoadBalancer (using MetalLB) and publish a message from another machine.

<br>

1. First, we need to deploy a LoadBalancer service for the hivemq-broker deployment:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: hivemq-broker-lb
spec:
  selector:
    app: hivemq-broker
  ports:
    - protocol: TCP
      port: 1883
      targetPort: 1883
  type: LoadBalancer
EOF
```

> [!TIP]
> This can be included with the `hivemq-broker` manifests.

2. Get the service and verify the external IP:

```bash
kubectl get service/hivemq-broker-lb

NAME               TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)          AGE
hivemq-broker-lb   LoadBalancer   10.233.24.224   192.168.1.240   1883:30434/TCP   13s
```

`192.168.1.240` is now the external IP for the HiveMQ Broker and should be available on the network. I will test this by running `telnet 192.168.1.240 1883` from another machine on the network.

```bash
# MacOS (local machine)
➜ telnet 192.168.1.240 1883
Trying 192.168.1.240...
Connected to 192.168.1.240.
Escape character is '^]'.
```

3. Publish a message to the HiveMQ Broker:

With the connection verified, from my local machine (MacOS) I'll use the `hivemq/mqtt-cli` to publish a message to the HiveMQ Broker.

```bash
docker run hivemq/mqtt-cli pub -h 192.168.1.240 -p 1883 -u admin-user -pw admin-password -t test -m "hello"
```

`192.168.1.240` - replace with the external IP of the HiveMQ Broker.

4. Monitor the HiveMQ Listener logs to ensure the message is received:

I'll go back to the server running Kubernetes, and run the following command to print the logs of the HiveMQ Listener:

```bash
kubectl logs deploy/hivemq-listener-node
```

You should see the following output:

```bash
Connected to MQTT broker
Connected to MongoDB
Received message 'hello' on topic 'test' with QoS undefined
```

As you can see, the `hivemq-listener-node` has received the message and connected to MongoDB.

5. Verify the message is stored in MongoDB:

I'll use MongoDB Compass to connect to the MongoDB instance and verify the message is stored. 

MongoDB is not exposed to the network, so I'll deploy a LoadBalancer service for MongoDB to access it from my local machine.

```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: mongodb-lb
spec:
  selector:
    app.kubernetes.io/name: mongodb
  ports:
    - protocol: TCP
      port: 27017
      targetPort: 27017
  type: LoadBalancer
EOF
```

Get the service and verify the external IP:

```bash
kubectl get service/mongodb-lb

NAME         TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)           AGE
mongodb-lb   LoadBalancer   10.233.34.131   192.168.1.241   27017:32167/TCP   10s
```

![image](https://github.com/chrisvfabio/kubernetes-bare-metal/assets/5626828/27f1394f-b4d2-4a5b-bb30-cf94ed436179)


🎉 As you can see above, we successfully connected to MongoDB and confirmed our `hivemq-listener-node` application was able to received the message and persist it in MongoDB!


## Dependencies

### Network Dependencies

The following is a list of network dependencies required for the installation. If the target environment has egress restrictions, ensure the following urls are whitelisted:

- https://dl.k8s.io
- https://github.com
- https://storage.googleapis.com
- https://get.helm.sh
