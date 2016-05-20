# Redis Sentinel UI

## 部署运行:

1. `git clone https://github.com/youngsterxyf/redis-sentinel-ui.git`
2. `cd redis-sentinel-ui && npm install`
3. `gulp default`
4. 数据库初始化: `node init.js`
5. 启动后台redis监控数据收集进程: `node god.js`
6. 启用web应用进程: `node app.js`

## 截图

![rsm-main-1](https://raw.github.com/youngsterxyf/redis-sentinel-ui/master/screenshot/rsm-main-1.png)
![rsm-main-2](https://raw.github.com/youngsterxyf/redis-sentinel-ui/master/screenshot/rsm-main-2.png)
![rsm-stat-1](https://raw.github.com/youngsterxyf/redis-sentinel-ui/master/screenshot/rsm-stat-1.png)
![rsm-stat-2](https://raw.github.com/youngsterxyf/redis-sentinel-ui/master/screenshot/rsm-stat-2.png)
![rsm-stat-3](https://raw.github.com/youngsterxyf/redis-sentinel-ui/master/screenshot/rsm-stat-3.png)
![rsm-cmd](https://raw.github.com/youngsterxyf/redis-sentinel-ui/master/screenshot/rsm-cmd.png)
