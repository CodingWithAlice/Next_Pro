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
2、在 Next_Pro 目录构建：sudo docker build -t next_pro .
- 本地 npm run build 确认没有问题
- => => writing image sha256:32f2351a67a8c4704e94e42177f64cdb1e16aa7d1e9eb4bb2c59c3d8ac2c3440
 => => naming to docker.io/library/next_pro 212.7s
3、启动服务：sudo docker run -d -p 3000:3000 next_pro
- 查看运行中的容器 sudo docker ps 如果 找到对应 IMAGES + STATUS为 up 即成功
- 查看容器日志 sudo docker logs next_pro 获取日志
- 检查端口占用情况 sudo netstat -tuln | grep :3000 检查主机的 3000 端口是否被监听
(启动后， 在防火墙配置开放该端口  3000  的入站规则)

http://121.43.164.209:3000
http://codingwithalice.top:3000/