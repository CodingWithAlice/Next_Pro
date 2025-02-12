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
- git pull 拉取
2、在 Next_Pro 目录构建：sudo docker build -t next_pro .
- 本地 npm run build 确认没有问题
3、在根目录启动服务：docker run -d -p 3000:3000 next_pro
