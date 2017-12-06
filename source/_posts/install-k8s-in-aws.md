title: Install K8s In AWS Step By Step
date: 2017-12-06 14:48:03
tags: k8s
---

## 1. 基础架构

![https://d33wubrfki0l68.cloudfront.net/e298a92e2454520dddefc3b4df28ad68f9b91c6f/70d52/images/docs/pre-ccm-arch.png](https://d33wubrfki0l68.cloudfront.net/e298a92e2454520dddefc3b4df28ad68f9b91c6f/70d52/images/docs/pre-ccm-arch.png)

### 基础设施

由AWS创建三台主机，使用相同安全组设置，特别注意的是安全组策略会限制主机之间的相互访问，ETCD部署需要开放TCP协议，Flannel部署需要开放UDP协议

主机     | 角色    | 内网IP地址     |组件                                                                                              | 登录信息|
---      |  ---    | ---            | ---                                                                                              | ---     |
master   | Master, etcd-host0  | 172.31.31.156  | etcd, flanneld, kubectl, kube-apiserver,kube-controller-manager,kube-scheduler  | ssh -i "k8s-master.pem" ubuntu@ec2-13-114-53-13.ap-northeast-1.compute.amazonaws.com        |
node1    | Node, etcd-host1    | 172.31.23.108  | etcd, flanneld, kubectl, kubelet, kube-proxy, docker                                             |  ssh -i "k8s-master.pem" ubuntu@ec2-13-230-84-191.ap-northeast-1.compute.amazonaws.com       |
node2    | Node, etcd-host2    | 172.31.31.58   | etcd, flanneld, kubectl, kubelet, kube-proxy, docker                                             |  ssh -i "k8s-master.pem" ubuntu@ec2-13-230-151-250.ap-northeast-1.compute.amazonaws.com        |

### 软件版本

* docker 1.13.1
* etcd v3.1.6
* kubernetes(kube-apiserver,kube-controller-manager,kube-scheduler,kube-proxy,kubelet,kubectl) v1.8.4
* flannel v0.9.1

### 集群环境变量文件

```
# environment.sh
export BOOTSTRAP_TOKEN="41f7e4ba8b7be874fcff18bf5cf41a7c"
export SERVICE_CIDR="10.254.0.0/16"
export CLUSTER_CIDR="172.30.0.0/16"
export NODE_PORT_RANGE="8400-9000"
export ETCD_ENDPOINTS="https://172.31.31.156:2379,https://172.31.23.108:2379,https://172.31.31.58:2379"
export FLANNEL_ETCD_PREFIX="/kubernetes/network"
export CLUSTER_KUBERNETES_SVC_IP="10.254.0.1"
export CLUSTER_DNS_SVC_IP="10.254.0.2"
export CLUSTER_DNS_DOMAIN="cluster.local."
```

## 2. 创建 CA 证书和秘钥

安装秘钥生成工具CFSSL

```
wget https://pkg.cfssl.org/R1.2/cfssl_linux-amd64
chmod +x cfssl_linux-amd64
sudo mv cfssl_linux-amd64 /usr/local/bin/cfssl

wget https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64
chmod +x cfssljson_linux-amd64
sudo mv cfssljson_linux-amd64 /usr/local/bin/cfssljson

wget https://pkg.cfssl.org/R1.2/cfssl-certinfo_linux-amd64
chmod +x cfssl-certinfo_linux-amd64
sudo mv cfssl-certinfo_linux-amd64 /usr/local/bin/cfssl-certinfo

mkdir ssl && cd ssl
cfssl print-defaults config > ca-config.json
cfssl print-defaults csr > ca-csr.json
```

创建CA配置文件

```
$ cat ca-config.json
{
  "signing": {
    "default": {
      "expiry": "8760h"
    },
    "profiles": {
      "kubernetes": {
        "usages": [
            "signing",
            "key encipherment",
            "server auth",
            "client auth"
        ],
        "expiry": "8760h"
      }
    }
  }
}
```

创建CA证书签名请求

```
$ cat ca-csr.json
{
  "CN": "kubernetes",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "BeiJing",
      "L": "BeiJing",
      "O": "k8s",
      "OU": "System"
    }
  ]
}
```

生成CA证书和秘钥

```
cfssl gencert -initca ca-csr.json | cfssljson -bare ca

2017/11/28 15:52:02 [INFO] generating a new CA key and certificate from CSR
2017/11/28 15:52:02 [INFO] generate received request
2017/11/28 15:52:02 [INFO] received CSR
2017/11/28 15:52:02 [INFO] generating key: ecdsa-256
2017/11/28 15:52:02 [INFO] encoded CSR
2017/11/28 15:52:02 [INFO] signed certificate with serial number 666532197056425267883435068110304299486670212021
```

分发证书

> 将生成的CA证书，秘钥文件，配置文件拷贝到所有机器的/etc/kubernetes/ssl目录下

```
cd /etc/kubernetes/ssl
cp ca.pem kubernetes.pem

scp ca* ubuntu@node1:/home/ubuntu/ssl/
scp ca* ubuntu@node2:/home/ubuntu/ssl/

sudo mkdir -p /etc/kubernetes/ssl
sudo cp ca* /etc/kubernetes/ssl

# validate
openssl x509  -noout -text -in  kubernetes.pem
```

## 3. 部署ETCD集群

下载etcd二进制包

```
wget https://github.com/coreos/etcd/releases/download/v3.1.6/etcd-v3.1.6-linux-amd64.tar.gz
tar -xvf etcd-v3.1.6-linux-amd64.tar.gz
sudo mv etcd-v3.1.6-linux-amd64/etcd* /usr/local/bin
```

设置环境变量

> 节点部署时设置各自的环境变量信息

```
export NODE_NAME=etcd-host0 # node1: etcd-host1  node2: etcd-host2
export NODE_IP=172.31.31.156 # node1: 172.31.23.108 node2: 172.31.31.58
export NODE_IPS="172.31.31.156 172.31.31.58 172.31.23.108"
export ETCD_NODES=etcd-host0=https://172.31.31.156:2380,etcd-host2=https://172.31.31.58:2380,etcd-host1=https://172.31.23.108:2380
```

### 创建 TLS 秘钥和证书

创建证书签名请求文件

```
cd ~/ssl

cat > etcd-csr.json <<EOF
{
  "CN": "etcd",
  "hosts": [
    "127.0.0.1",
    "${NODE_IP}"
  ],
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "BeiJing",
      "L": "BeiJing",
      "O": "k8s",
      "OU": "System"
    }
  ]
}
EOF

#基于CA证书生成etcd证书和秘钥

sudo cfssl gencert -ca=/etc/kubernetes/ssl/ca.pem \
  -ca-key=/etc/kubernetes/ssl/ca-key.pem \
  -config=/etc/kubernetes/ssl/ca-config.json \
  -profile=kubernetes etcd-csr.json | cfssljson -bare etcd
  
ls etcd*
etcd-csr.json  etcd-key.pem  etcd.csr  etcd.pem

sudo mkdir -p /etc/etcd/ssl
sudo mv etcd*.pem /etc/etcd/ssl
```

### 创建 etcd 的 systemd unit 文件

```
sudo mkdir -p /var/lib/etcd

cat > etcd.service <<EOF
[Unit]
Description=Etcd Server
After=network.target
After=network-online.target
Wants=network-online.target
Documentation=https://github.com/coreos

[Service]
Type=notify
WorkingDirectory=/var/lib/etcd/
ExecStart=/usr/local/bin/etcd \\
  --name=${NODE_NAME} \\
  --cert-file=/etc/etcd/ssl/etcd.pem \\
  --key-file=/etc/etcd/ssl/etcd-key.pem \\
  --peer-cert-file=/etc/etcd/ssl/etcd.pem \\
  --peer-key-file=/etc/etcd/ssl/etcd-key.pem \\
  --trusted-ca-file=/etc/kubernetes/ssl/ca.pem \\
  --peer-trusted-ca-file=/etc/kubernetes/ssl/ca.pem \\
  --initial-advertise-peer-urls=https://${NODE_IP}:2380 \\
  --listen-peer-urls=https://${NODE_IP}:2380 \\
  --listen-client-urls=https://${NODE_IP}:2379,http://127.0.0.1:2379 \\
  --advertise-client-urls=https://${NODE_IP}:2379 \\
  --initial-cluster-token=etcd-cluster-0 \\
  --initial-cluster=${ETCD_NODES} \\
  --initial-cluster-state=new \\
  --data-dir=/var/lib/etcd
Restart=on-failure
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF
```

### 启动ETCD

```
sudo cp etcd.service /lib/systemd/system/
sudo chmod +x /lib/systemd/system/etcd.service
sudo systemctl daemon-reload
sudo systemctl enable etcd
sudo systemctl start etcd
systemctl status etcd
```

### 验证ETCD

> 确保服务器节点之间TCP/2379端口能够相互访问

```
for ip in ${NODE_IPS}; do
  ETCDCTL_API=3 /usr/local/bin/etcdctl \
  --endpoints=https://${ip}:2379  \
  --cacert=/etc/kubernetes/ssl/ca.pem \
  --cert=/etc/etcd/ssl/etcd.pem \
  --key=/etc/etcd/ssl/etcd-key.pem \
  endpoint health; done
```

```
ETCDCTL_API=3 /usr/local/bin/etcdctl --endpoints=https://172.31.23.108:2379 --cacert=/etc/kubernetes/ssl/ca.pem --cert=/etc/etcd/ssl/etcd.pem --key=/etc/etcd/ssl/etcd-key.pem endpoint health
```

## 4. 部署Kubectl

```
export MASTER_IP=172.31.31.156
export KUBE_APISERVER="https://${MASTER_IP}:6443"
```

```
wget https://dl.k8s.io/v1.8.4/kubernetes-client-linux-amd64.tar.gz
tar -xzvf kubernetes-client-linux-amd64.tar.gz
sudo cp kubernetes/client/bin/kube* /usr/local/bin/
sudo chmod a+x /usr/local/bin/kube*
```

创建admin证书

```
cd ssl

cat > admin-csr.json <<EOF
{
  "CN": "admin",
  "hosts": [],
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "BeiJing",
      "L": "BeiJing",
      "O": "system:masters",
      "OU": "System"
    }
  ]
}
EOF

sudo cfssl gencert -ca=/etc/kubernetes/ssl/ca.pem \
  -ca-key=/etc/kubernetes/ssl/ca-key.pem \
  -config=/etc/kubernetes/ssl/ca-config.json \
  -profile=kubernetes admin-csr.json | cfssljson -bare admin
  
ls admin*
admin-csr.json  admin-key.pem  admin.csr  admin.pem
sudo mv admin*.pem /etc/kubernetes/ssl/
```

创建kubectl kubeconfig文件

```
# 设置集群参数
kubectl config set-cluster kubernetes \
  --certificate-authority=/etc/kubernetes/ssl/ca.pem \
  --embed-certs=true \
  --server=${KUBE_APISERVER}
# 设置客户端认证参数
kubectl config set-credentials admin \
  --client-certificate=/etc/kubernetes/ssl/admin.pem \
  --embed-certs=true \
  --client-key=/etc/kubernetes/ssl/admin-key.pem
# 设置上下文参数
kubectl config set-context kubernetes \
  --cluster=kubernetes \
  --user=admin
# 设置默认上下文
kubectl config use-context kubernetes
```

分发kubeconfig文件

```
scp ~/.kube/config ubuntu@node1:/home/ubuntu/.kube/config
scp ~/.kube/config ubuntu@node2:/home/ubuntu/.kube/config
```

## 5. 部署Flannel网络

设置环境变量

```
export NODE_IP=172.31.31.156
source environment.sh
```

创建 TLS 秘钥和证书

```
cd ssl

cat > flanneld-csr.json <<EOF
{
  "CN": "flanneld",
  "hosts": [],
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "BeiJing",
      "L": "BeiJing",
      "O": "k8s",
      "OU": "System"
    }
  ]
}
EOF

```

生成flanneld证书和私钥匙

```
$ sudo cfssl gencert -ca=/etc/kubernetes/ssl/ca.pem \
  -ca-key=/etc/kubernetes/ssl/ca-key.pem \
  -config=/etc/kubernetes/ssl/ca-config.json \
  -profile=kubernetes flanneld-csr.json | cfssljson -bare flanneld

$ ls flanneld*
flanneld-csr.json  flanneld-key.pem  flanneld.csr  flanneld.pem

$ sudo mkdir -p /etc/flanneld/ssl
$ sudo mv flanneld*.pem /etc/flanneld/ssl
```

向etcd写入集群Pod网段信息

> flanneld 目前版本 (v0.7.1) 不支持 etcd v3

```
etcdctl \
  --endpoints=${ETCD_ENDPOINTS} \
  --ca-file=/etc/kubernetes/ssl/ca.pem \
  --cert-file=/etc/flanneld/ssl/flanneld.pem \
  --key-file=/etc/flanneld/ssl/flanneld-key.pem \
  set ${FLANNEL_ETCD_PREFIX}/config '{"Network":"'${CLUSTER_CIDR}'", "SubnetLen": 24, "Backend": {"Type": "vxlan"}}'
```

> flanneld 目前版本 (v0.9.1)

```
ETCDCTL_API=3 /usr/local/bin/etcdctl --endpoints=${ETCD_ENDPOINTS} --cacert=/etc/kubernetes/ssl/ca.pem --cert=/etc/etcd/ssl/etcd.pem --key=/etc/etcd/ssl/etcd-key.pem put ${FLANNEL_ETCD_PREFIX}/config '{"Network":"'${CLUSTER_CIDR}'", "SubnetLen": 24, "Backend": {"Type": "vxlan"}}'
```

下载flanneld

```
mkdir flannel
wget https://github.com/coreos/flannel/releases/download/v0.9.1/flannel-v0.9.1-linux-amd64.tar.gz
tar -xzvf flannel-v0.9.1-linux-amd64.tar.gz -C flannel
sudo cp flannel/{flanneld,mk-docker-opts.sh} /usr/local/bin
```

创建flanneld的system unit文件

```
cat > flanneld.service << EOF
[Unit]
Description=Flanneld overlay address etcd agent
After=network.target
After=network-online.target
Wants=network-online.target
After=etcd.service
Before=docker.service

[Service]
Type=notify
ExecStart=/usr/local/bin/flanneld \\
  -etcd-cafile=/etc/kubernetes/ssl/ca.pem \\
  -etcd-certfile=/etc/flanneld/ssl/flanneld.pem \\
  -etcd-keyfile=/etc/flanneld/ssl/flanneld-key.pem \\
  -etcd-endpoints=${ETCD_ENDPOINTS} \\
  -etcd-prefix=${FLANNEL_ETCD_PREFIX}
ExecStartPost=/usr/local/bin/mk-docker-opts.sh -k DOCKER_NETWORK_OPTIONS -d /run/flannel/docker
Restart=on-failure

[Install]
WantedBy=multi-user.target
RequiredBy=docker.service
EOF
```

启动flanneld

```
sudo cp flanneld.service /lib/systemd/system/flanneld.service
sudo chmod +x /lib/systemd/system/flanneld.service
sudo systemctl daemon-reload
sudo systemctl enable flanneld
sudo systemctl start flanneld
systemctl status flanneld
```

检查flanneld的Pod网段信息

```
# 查看集群 Pod 网段(/16)
etcdctl \
  --endpoints=${ETCD_ENDPOINTS} \
  --ca-file=/etc/kubernetes/ssl/ca.pem \
  --cert-file=/etc/flanneld/ssl/flanneld.pem \
  --key-file=/etc/flanneld/ssl/flanneld-key.pem \
  get ${FLANNEL_ETCD_PREFIX}/config
```

```
# 查看已分配的 Pod 子网段列表(/24)
etcdctl \
  --endpoints=${ETCD_ENDPOINTS} \
  --ca-file=/etc/kubernetes/ssl/ca.pem \
  --cert-file=/etc/flanneld/ssl/flanneld.pem \
  --key-file=/etc/flanneld/ssl/flanneld-key.pem \
  ls ${FLANNEL_ETCD_PREFIX}/subnets
```



```
#查看某一 Pod 网段对应的 flanneld 进程监听的 IP 和网络参数
etcdctl \
  --endpoints=${ETCD_ENDPOINTS} \
  --ca-file=/etc/kubernetes/ssl/ca.pem \
  --cert-file=/etc/flanneld/ssl/flanneld.pem \
  --key-file=/etc/flanneld/ssl/flanneld-key.pem \
  get ${FLANNEL_ETCD_PREFIX}/subnets/172.30.19.0-24
```

## 6. 部署Master节点

### 设置环境变量

```
export MASTER_IP=172.31.31.156
source environment.sh
```

```
wget https://github.com/kubernetes/kubernetes/releases/download/v1.8.4/kubernetes.tar.gz
tar -xzvf kubernetes.tar.gz
cd kubernetes
./cluster/get-kube-binaries.sh

cd server
tar -xzvf kubernetes-server-linux-amd64.tar.gz
cd kubernetes
sudo cp -r server/bin/{kube-apiserver,kube-controller-manager,kube-scheduler,kubectl,kube-proxy,kubelet} /usr/local/bin/
```

### 创建kubernetes证书

```
#创建Kubernetes证书签名请求
cd ssl

cat > kubernetes-csr.json <<EOF
{
  "CN": "kubernetes",
  "hosts": [
    "127.0.0.1",
    "${MASTER_IP}",
    "${CLUSTER_KUBERNETES_SVC_IP}",
    "kubernetes",
    "kubernetes.default",
    "kubernetes.default.svc",
    "kubernetes.default.svc.cluster",
    "kubernetes.default.svc.cluster.local"
  ],
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "BeiJing",
      "L": "BeiJing",
      "O": "k8s",
      "OU": "System"
    }
  ]
}
EOF
```

```
# 生成 kubernetes 证书和私钥
sudo cfssl gencert -ca=/etc/kubernetes/ssl/ca.pem \
  -ca-key=/etc/kubernetes/ssl/ca-key.pem \
  -config=/etc/kubernetes/ssl/ca-config.json \
  -profile=kubernetes kubernetes-csr.json | cfssljson -bare kubernetes
ls kubernetes*
kubernetes-csr.json  kubernetes-key.pem  kubernetes.csr  kubernetes.pem
sudo mkdir -p /etc/kubernetes/ssl/
sudo mv kubernetes*.pem /etc/kubernetes/ssl/
```

### 配置启动kube-apiserver

```
cat > token.csv <<EOF
${BOOTSTRAP_TOKEN},kubelet-bootstrap,10001,"system:kubelet-bootstrap"
EOF
sudo mv token.csv /etc/kubernetes/
```

创建kube-apiserver的system unit

```
cat  > kube-apiserver.service <<EOF
[Unit]
Description=Kubernetes API Server
Documentation=https://github.com/GoogleCloudPlatform/kubernetes
After=network.target

[Service]
ExecStart=/usr/local/bin/kube-apiserver \\
  --admission-control=NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,ResourceQuota \\
  --advertise-address=${MASTER_IP} \\
  --bind-address=${MASTER_IP} \\
  --insecure-bind-address=${MASTER_IP} \\
  --authorization-mode=RBAC \\
  --runtime-config=rbac.authorization.k8s.io/v1alpha1 \\
  --kubelet-https=true \\
  --experimental-bootstrap-token-auth \\
  --token-auth-file=/etc/kubernetes/token.csv \\
  --service-cluster-ip-range=${SERVICE_CIDR} \\
  --service-node-port-range=${NODE_PORT_RANGE} \\
  --tls-cert-file=/etc/kubernetes/ssl/kubernetes.pem \\
  --tls-private-key-file=/etc/kubernetes/ssl/kubernetes-key.pem \\
  --client-ca-file=/etc/kubernetes/ssl/ca.pem \\
  --service-account-key-file=/etc/kubernetes/ssl/ca-key.pem \\
  --etcd-cafile=/etc/kubernetes/ssl/ca.pem \\
  --etcd-certfile=/etc/kubernetes/ssl/kubernetes.pem \\
  --etcd-keyfile=/etc/kubernetes/ssl/kubernetes-key.pem \\
  --etcd-servers=${ETCD_ENDPOINTS} \\
  --enable-swagger-ui=true \\
  --allow-privileged=true \\
  --apiserver-count=3 \\
  --audit-log-maxage=30 \\
  --audit-log-maxbackup=3 \\
  --audit-log-maxsize=100 \\
  --audit-log-path=/var/lib/audit.log \\
  --event-ttl=1h \\
  --v=2
Restart=on-failure
RestartSec=5
Type=notify
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF
```

启动kube-apiserver

```
sudo cp kube-apiserver.service /lib/systemd/system/kube-apiserver.service
sudo chmod +x /lib/systemd/system/kube-apiserver.service
sudo systemctl daemon-reload
sudo systemctl enable kube-apiserver
sudo systemctl start kube-apiserver
systemctl status kube-apiserver
```

### 配置和启动kube-controller-manager

创建 kube-controller-manager 的 systemd unit 文件

```
cat > kube-controller-manager.service <<EOF
[Unit]
Description=Kubernetes Controller Manager
Documentation=https://github.com/GoogleCloudPlatform/kubernetes

[Service]
ExecStart=/usr/local/bin/kube-controller-manager \\
  --address=127.0.0.1 \\
  --master=http://${MASTER_IP}:8080 \\
  --allocate-node-cidrs=true \\
  --service-cluster-ip-range=${SERVICE_CIDR} \\
  --cluster-cidr=${CLUSTER_CIDR} \\
  --cluster-name=kubernetes \\
  --cluster-signing-cert-file=/etc/kubernetes/ssl/ca.pem \\
  --cluster-signing-key-file=/etc/kubernetes/ssl/ca-key.pem \\
  --service-account-private-key-file=/etc/kubernetes/ssl/ca-key.pem \\
  --root-ca-file=/etc/kubernetes/ssl/ca.pem \\
  --leader-elect=true \\
  --v=2
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

启动kube-controller-manager

```
sudo cp kube-controller-manager.service /lib/systemd/system/kube-controller-manager.service
sudo chmod +x /lib/systemd/system/kube-controller-manager.service
sudo systemctl daemon-reload
sudo systemctl enable kube-controller-manager
sudo systemctl start kube-controller-manager
systemctl status kube-controller-manager
```

### 配置和启动 kube-scheduler

```
cat > kube-scheduler.service <<EOF
[Unit]
Description=Kubernetes Scheduler
Documentation=https://github.com/GoogleCloudPlatform/kubernetes

[Service]
ExecStart=/usr/local/bin/kube-scheduler \\
  --address=127.0.0.1 \\
  --master=http://${MASTER_IP}:8080 \\
  --leader-elect=true \\
  --v=2
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

启动kube-scheduler

```
sudo cp kube-scheduler.service /lib/systemd/system/kube-scheduler.service
sudo chmod +x /lib/systemd/system/kube-scheduler.service
sudo systemctl daemon-reload
sudo systemctl enable kube-scheduler
sudo systemctl start kube-scheduler
systemctl status kube-scheduler
```

验证master节点功能

```
kubectl get componentstatuses
```

## 7. 部署Node节点

设置环境变量

```
export MASTER_IP=172.31.31.156
export KUBE_APISERVER="https://${MASTER_IP}:6443"
export NODE_IP=172.31.23.108
source environment.sh
```

安装docker

```
apt-get update
apt-get install -y docker.io
```

or 

```
apt-get update
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/$(. /etc/os-release; echo "$ID") \
   $(lsb_release -cs) \
   stable"
apt-get update && apt-get install -y docker-ce=$(apt-cache madison docker-ce | grep 17.09 | head -1 | awk '{print $3}')
```

## Make sure that the cgroup driver used by kubelet is the same as the one used by Docker

```
cat << EOF > /etc/docker/daemon.json
{
  "exec-opts": ["native.cgroupdriver=cgroupfs"],
  "max-concurrent-downloads": 10
}
EOF
```

设置systemd unit文件

```
cat /lib/systemd/system/docker.service
[Unit]
Description=Docker Application Container Engine
Documentation=https://docs.docker.com
After=network.target docker.socket firewalld.service
Requires=docker.socket

[Service]
Type=notify
# the default is not to use systemd for cgroups because the delegate issues still
# exists and systemd currently does not support the cgroup feature set required
# for containers run by docker
EnvironmentFile=-/etc/default/docker
EnvironmentFile=-/run/flannel/docker
ExecStart=/usr/bin/dockerd -H fd:// $DOCKER_OPTS --log-level=error $DOCKER_NETWORK_OPTIONS
ExecReload=/bin/kill -s HUP $MAINPID
Restart=on-failure
RestartSec=5
LimitNOFILE=1048576
# Having non-zero Limit*s causes performance problems due to accounting overhead
# in the kernel. We recommend using cgroups to do container-local accounting.
LimitNPROC=infinity
LimitCORE=infinity
# Uncomment TasksMax if your systemd version supports it.
# Only systemd 226 and above support this version.
TasksMax=infinity
TimeoutStartSec=0
# set delegate yes so that systemd does not reset the cgroups of docker containers
Delegate=yes
# kill only the docker process, not all processes in the cgroup
KillMode=process

[Install]
WantedBy=multi-user.target
```

```
sudo systemctl daemon-reload
sudo systemctl stop firewalld
sudo systemctl disable firewalld
sudo iptables -F && sudo iptables -X && sudo iptables -F -t nat && sudo iptables -X -t nat
sudo systemctl enable docker
sudo systemctl start docker
```

### 安装和配置kubelet

创建clusterrolebinding

```
kubectl create clusterrolebinding kubelet-bootstrap --clusterrole=system:node-bootstrapper --user=kubelet-bootstrap
kubectl create clusterrolebinding kubelet-nodes --clusterrole=system:node --group=system:nodes
```

下载kubelet和kube-proxy

```
wget https://dl.k8s.io/v1.8.4/kubernetes-server-linux-amd64.tar.gz
tar -xzvf kubernetes-server-linux-amd64.tar.gz
cd kubernetes
sudo cp -r ./server/bin/{kube-proxy,kubelet} /usr/local/bin/
```

创建 kubelet bootstrapping kubeconfig 文件

```
# 设置集群参数
kubectl config set-cluster kubernetes \
  --certificate-authority=/etc/kubernetes/ssl/ca.pem \
  --embed-certs=true \
  --server=${KUBE_APISERVER} \
  --kubeconfig=bootstrap.kubeconfig
# 设置客户端认证参数
kubectl config set-credentials kubelet-bootstrap \
  --token=${BOOTSTRAP_TOKEN} \
  --kubeconfig=bootstrap.kubeconfig
# 设置上下文参数
kubectl config set-context default \
  --cluster=kubernetes \
  --user=kubelet-bootstrap \
  --kubeconfig=bootstrap.kubeconfig
# 设置默认上下文
kubectl config use-context default --kubeconfig=bootstrap.kubeconfig
sudo mv bootstrap.kubeconfig /etc/kubernetes/
```

创建 kubelet 的 systemd unit 文件

```
sudo mkdir /var/lib/kubelet

cat > kubelet.service <<EOF
[Unit]
Description=Kubernetes Kubelet
Documentation=https://github.com/GoogleCloudPlatform/kubernetes
After=docker.service
Requires=docker.service

[Service]
WorkingDirectory=/var/lib/kubelet
ExecStart=/usr/local/bin/kubelet \\
  --address=${NODE_IP} \\
  --hostname-override=${NODE_IP} \\
  --pod-infra-container-image=registry.access.redhat.com/rhel7/pod-infrastructure:latest \\
  --experimental-bootstrap-kubeconfig=/etc/kubernetes/bootstrap.kubeconfig \\
  --kubeconfig=/etc/kubernetes/kubelet.kubeconfig \\
  --require-kubeconfig \\
  --cert-dir=/etc/kubernetes/ssl \\
  --cluster-dns=${CLUSTER_DNS_SVC_IP} \\
  --cluster-domain=${CLUSTER_DNS_DOMAIN} \\
  --hairpin-mode promiscuous-bridge \\
  --allow-privileged=true \\
  --serialize-image-pulls=false \\
  --logtostderr=true \\
  --v=2
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

启动kubelet

```
sudo cp kubelet.service /lib/systemd/system/kubelet.service
sudo chmod +x /lib/systemd/system/kubelet.service
sudo systemctl daemon-reload
sudo systemctl enable kubelet
sudo systemctl start kubelet
systemctl status kubelet
```

通过kubelet的tls证书请求

```
# 查看未授权的请求
kubectl get csr
NAME        AGE       REQUESTOR           CONDITION
csr-2b308   4m        kubelet-bootstrap   Pending
$ kubectl get nodes
No resources found.
```

```
#通过CSR请求
kubectl certificate approve csr-2b308
certificatesigningrequest "csr-2b308" approved
kubectl get nodes
NAME        STATUS    AGE       VERSION
10.64.3.7   Ready     49m       v1.6.2
```

### 配置kube-proxy

```
cat << EOF > kube-proxy-csr.json
{
  "CN": "system:kube-proxy",
  "hosts": [],
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "BeiJing",
      "L": "BeiJing",
      "O": "k8s",
      "OU": "System"
    }
  ]
}
EOF

sudo cfssl gencert -ca=/etc/kubernetes/ssl/ca.pem \
  -ca-key=/etc/kubernetes/ssl/ca-key.pem \
  -config=/etc/kubernetes/ssl/ca-config.json \
  -profile=kubernetes  kube-proxy-csr.json | cfssljson -bare kube-proxy

ls kube-proxy*
kube-proxy.csr  kube-proxy-csr.json  kube-proxy-key.pem  kube-proxy.pem
sudo mv kube-proxy*.pem /etc/kubernetes/ssl/
```

创建kube-proxy kubeconfg文件

```
# 设置集群参数
kubectl config set-cluster kubernetes \
  --certificate-authority=/etc/kubernetes/ssl/ca.pem \
  --embed-certs=true \
  --server=${KUBE_APISERVER} \
  --kubeconfig=kube-proxy.kubeconfig
# 设置客户端认证参数
kubectl config set-credentials kube-proxy \
  --client-certificate=/etc/kubernetes/ssl/kube-proxy.pem \
  --client-key=/etc/kubernetes/ssl/kube-proxy-key.pem \
  --embed-certs=true \
  --kubeconfig=kube-proxy.kubeconfig
# 设置上下文参数
kubectl config set-context default \
  --cluster=kubernetes \
  --user=kube-proxy \
  --kubeconfig=kube-proxy.kubeconfig
# 设置默认上下文
kubectl config use-context default --kubeconfig=kube-proxy.kubeconfig
sudo mv kube-proxy.kubeconfig /etc/kubernetes/
```

创建kube-proxy的system unit文件

```
sudo mkdir -p /var/lib/kube-proxy

cat > kube-proxy.service <<EOF
[Unit]
Description=Kubernetes Kube-Proxy Server
Documentation=https://github.com/GoogleCloudPlatform/kubernetes
After=network.target

[Service]
WorkingDirectory=/var/lib/kube-proxy
ExecStart=/usr/local/bin/kube-proxy \\
  --bind-address=${NODE_IP} \\
  --hostname-override=${NODE_IP} \\
  --cluster-cidr=${SERVICE_CIDR} \\
  --kubeconfig=/etc/kubernetes/kube-proxy.kubeconfig \\
  --logtostderr=true \\
  --v=2
Restart=on-failure
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF
```

启动kube-proxy

```
sudo cp kube-proxy.service /lib/systemd/system/kube-proxy.service
sudo chmod +x /lib/systemd/system/kube-proxy.service
sudo systemctl daemon-reload
sudo systemctl enable kube-proxy
sudo systemctl start kube-proxy
systemctl status kube-proxy
```

## 8. 部署DNS Plugin

> 预定义的 RoleBinding system:kube-dns 将 kube-system 命名空间的 kube-dns ServiceAccount 与 system:kube-dns Role 绑定， 该 Role 具有访问 kube-apiserver DNS 相关 API 的权限

```
cd ~/kubernetes/cluster/addons/dns
```

kubedns-svc.yaml 

* 修改 ```__PILLAR__DNS__SERVER__``` 到 ```10.254.0.2``` (environment.sh环境变量中的$CLUSTER_DNS_SVC_IP)

kubedns-controller.yaml 

* 修改 ``` - --domain=__PILLAR__DNS__DOMAIN__. ``` 到 ``` - --domain=cluster.local. ```
* 修改  ``` - --server=/__PILLAR__DNS__DOMAIN__/127.0.0.1#10053 ```  到  ``` - --server=/cluster.local./127.0.0.1#10053 ```
* 修改 ```  - --probe=kubedns,127.0.0.1:10053,kubernetes.default.svc.__PILLAR__DNS__DOMAIN__,5,A ``` 到 ```  - --probe=kubedns,127.0.0.1:10053,kubernetes.default.svc.cluster.local.,5,A ```
* 修改 ``` - --probe=dnsmasq,127.0.0.1:53,kubernetes.default.svc.__PILLAR__DNS__DOMAIN__,5,A  ``` 到 ``` - --probe=dnsmasq,127.0.0.1:53,kubernetes.default.svc.cluster.local.,5,A ```

```
kubectl create -f .
```

## 9. 部署Dashboard Plugin

```
#dashboard-rbac.yml 创建rbc安全组
apiVersion: v1
kind: ServiceAccount
metadata:
  name: dashboard
  namespace: kube-system
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1alpha1
metadata:
  name: dashboard
subjects:
  - kind: ServiceAccount
    name: dashboard
    namespace: kube-system
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

```
controller添加 
serviceAccountName: dashboard
```

```
cd ~/kubernetes/cluster/addons/dashboard
kubectl create -f .
```

## 10. 部署Heapster Plugin

> Failed to parse /etc/grafana/grafana.ini, open /etc/grafana/grafana.ini: no such file or directory
> grafana部署失败，替换版本到heapster-grafana-amd64:v4.0.2

```
# create rbac cluster role binding
cd ~/heapster-1.4.3/deploy/kube-config/rbac
kubectl create -f heapster-rbac.yaml
cd ~/heapster-1.4.3/deploy/kube-config/influxdb
kubectl create -f .
```

## 11. 部署EFK Plugin

```
cd ~/kubernetes/cluster/addons/fluentd-elasticsearch
```

rbac授权

```
kubectl create -f .
```

## 12. 部署Ingress

```
curl https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/namespace.yaml | kubectl apply -f -
curl https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/default-backend.yaml | kubectl apply -f -
curl https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/configmap.yaml | kubectl apply -f -
curl https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/tcp-services-configmap.yaml | kubectl apply -f -
curl https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/udp-services-configmap.yaml | kubectl apply -f -
curl https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/rbac.yaml | kubectl apply -f -
curl https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/with-rbac.yaml | kubectl apply -f -
```

## 12. 问题定位

* 部署完成后Pod之间网络不通

开放所有iptables规则

```
sudo iptables -P INPUT ACCEPT
sudo iptables -P OUTPUT ACCEPT
sudo iptables -P FORWARD ACCEPT
```

可能原因docker0在flannel之前创建

```
sudo systemctl stop docker
sudo ip link delete docker0
sudo systemctl restart flanneld
sudo systemctl start docker
```

```
sudo ip link set docker0 promisc on
```

AWS安全组限制了UDP协议，需要AWS安全组打开所有UDP/TCP协议