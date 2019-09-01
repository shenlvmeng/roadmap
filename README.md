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

## 开发

### Electron部分

```bash
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
