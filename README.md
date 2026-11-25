# roadmap

> Based on the efforts of [shenlvmeng/calendone](https://github.com/shenlvmeng/calendone)

## 如何使用

0. 从[release](https://github.com/shenlvmeng/roadmap/releases)中下载对应系统版本
1. 输入必要信息
  - 导入gpx文件（可以在运动健身app中寻找）
  - *（可选）*输入定位中心城市（中文，默认北京）
  - *（可选）*输入网页标题
2. 点击“Generate!”生成资源文件到桌面名为`roadmap-output`的文件夹中
3. 直接将文件夹置于服务器目录即可

## 网页功能

- 展示所有轨迹的叠加
- 显示总里程、总时间
- 点击路线高亮整条路径，并显示对应运动详情
- 显示路径所在的所有城市和省份，点击跳转到城市所在位置
- 支持展示有gps定位的图片

## 地图服务

- 使用开源的 [MapLibre GL JS](https://maplibre.org/) 渲染地图
- 使用无需 API Key 的 [OpenFreeMap](https://openfreemap.org/) 矢量底图
- 省市识别在浏览器本地完成，不调用地图厂商的地理编码接口
- 继续兼容旧版本生成的 BD-09 轨迹数据，产物目录和数据格式不变

OpenFreeMap 公共服务不提供 SLA。页面必须联网加载地图 SDK 和底图，并按页面右下角显示的说明保留
OpenStreetMap/OpenMapTiles 数据署名。

已有的 `roadmap-output` 无需重新导入 GPX：使用新版本程序重新生成，或仅将其中的 `index.html`
替换为新版本生成的文件即可。

## 开发

### Electron部分

```bash
yarn install
# test
yarn dev
# start = dev
yarn start
# build
yarn build
yarn dist
# release = build + dist
yarn release
```

### web网页部分

```bash
yarn dev-portal
yarn build-portal
```

更多介绍见`doc/intro.md`。

## License

[MIT](LICENSE)
