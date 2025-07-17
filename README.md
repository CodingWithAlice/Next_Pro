基础信息：
 Nextjs + API Route + Sequelize + MySQL + Mongodb

主要实现的功能：
日报[时间序已完成，日总结]、周报[前端已完成，落表 todo]、月报、季报

### 2025.1.17

日报，连接本地数据库 Daily database 存储

### 2025.1.21

日报 - 日总结全部落表

1、周报 - 数据未落表

### 2025.2.12

1、周报 - 增改查
2、周报 - 数据源
3、月报

部署指令操作：
1、更新 Next_Pro 代码
- https://gitee.com/CodingWithAlice/Next_Pro 更新
- 方便国内 git pull 拉取
```js
// 当前分支的 commitId
git rev-parse --short HEAD 
```
2、在 Next_Pro 目录构建：sudo docker build -t next_pro .
- 本地 npm run build 确认没有问题
- => => writing image sha256:32f2351a67a8c4704e94e42177f64cdb1e16aa7d1e9eb4bb2c59c3d8ac2c3440
 => => naming to docker.io/library/next_pro 212.7s
3、启动服务：sudo docker run -d -p 3000:3000 next_pro
- 查看运行中的容器 sudo docker ps 如果 找到对应 IMAGES + STATUS为 up 即成功
- 查看容器日志 sudo docker logs next_pro 获取日志
- 检查端口占用情况 sudo netstat -tuln | grep :3000 检查主机的 3000 端口是否被监听
(启动后， 在防火墙配置开放该端口  3000  的入站规则)
```js
sudo docker stop intelligent_buck
sudo docker rm intelligent_buck
sudo docker build -t next_pro1 .
sudo docker run -d -p 3000:3000 next_pro1
// or 安装 Docker Compose
docker-compose up -d --build
```

http://121.43.164.209:3000
http://codingwithalice.top:3000/

### 2025.2.13

1、服务器 - 初始化数据盘
```js
// 切换为 root 用户，并返回根目录
sudo su root
cd
// 服务器内的数据盘信息
fdisk -l
```
/dev/vda12048 6143 40962M BIOS boot
/dev/vda26144   415743   409600  200M EFI System
/dev/vda3  415744 83886046 83470303 39.8G Linux filesystem

2、查看数据盘是否挂载
```js
df -h
```
查到的设备名，说明对应的分区已经挂载，并且会显示其挂载点
Filesystem  Size  Used Avail Use% Mounted on
/dev/vda340G  6.1G   32G  17% /
表示 /dev/vda3 分区已经挂载到根目录 / -> 已经挂载，说明它已经有文件系统了

3、显示文件系统的类型以及磁盘使用情况
```js
df -T /dev/vda3
```
Filesystem Type 1K-blocksUsed Available Use% Mounted on
/dev/vda3  ext4  40900288 6386396  32623616  17% /

4、创建子目录作为挂载点 /data/mysql
在 /dev/vda3 的挂载路径 / 下创建一个专门用于 MySQL 数据存储的子目录：
```js
mkdir -p /data/mysql
```

5、使用 docker run 命令启动 MySQL 容器，并将刚才创建的目录挂载到容器内的 MySQL 数据存储目录 /var/lib/mysql
```js
sudo docker run -d \
  --name next_pro \
  -e MYSQL_ROOT_PASSWORD=next_pro_alice \
  -p 3306:3306 \
  -v /data/mysql:/var/lib/mysql \
  mysql:8.0
```


使用 docker exec 命令进入正在运行的 MySQL 容器的命令行界面
```js
docker exec -it next_pro bash
// 使用当前的 root 密码登录 MySQL
mysql -u root -p
// 退出 MySQL 和容器
exit
```

6、再次遇到 caching_sha2_password 插件问题
- 本地：之前的解决方案是重新安装了 mysql 本地的包版本 - 切换登录插件版本为 Use Legacy Password Encryption
- 服务器： 将 root 用户的认证插件修改为 mysql_native_password
```js
docker exec -it next_pro bash
mysql -u root -p
ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'next_pro_alice';
FLUSH PRIVILEGES;
```

### 2025.2.19
将服务器的操作 从 docker 切换到 docker-compose
```js
sudo su root
// 第一次启动
sudo /usr/local/bin/docker-compose up -d
// 修改后重新启动
sudo /usr/local/bin/docker-compose down
// sudo /usr/local/bin/docker-compose down --rmi all
sudo /usr/local/bin/docker-compose up -d --build
// 日志
sudo /usr/local/bin/docker-compose logs daily-app
```
- https://gitee.com/CodingWithAlice/Next_Pro 更新
- 方便国内 git pull 拉取 

<!-- 清理 docker镜像 -->
```js
docker image ls 
// 清理所有悬空（dangling）镜像，悬空镜像指的是没有被任何标签引用的镜像
docker image prune
docker system prune
// 若要删除所有未被使用的镜像（不仅仅是悬空镜像）
docker image prune -a
``` 

### 2025.7.9
- 运行过程中查看接口调用日志
```js
sudo /usr/local/bin/docker-compose logs -f daily-app
```
