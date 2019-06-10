# roadmap

> Based on the efforts of [shenlvmeng/calendone](https://github.com/shenlvmeng/calendone)

## 如何使用

0. `yarn dist`或从release中下载对应系统版本
1. [申请一个百度地图ak秘钥](http://lbsyun.baidu.com/apiconsole/key?application=key)
2. 输入你申请的百度地图ak秘钥
3. 导入gpx文件（行者中，可以在轨迹详情页里找到“导出”选项）
4. *（可选）*填写其他信息
5. 一键生成资源文件到`output`（位于桌面）中
6. 将生成的文件放在服务器上即可

**非必选，但建议在应用设置里设置referer白名单为服务器域名，以防其他网站非法调用**

![设置referer白名单](https://s2.ax1x.com/2019/04/07/AhbwN9.png)

## 网页功能

[x] 展示所有轨迹的叠加
[x] 显示总里程、总时间
[x] 点击路线高亮整条路径，并显示对应运动详情
[x] 显示路径所在的所有城市和省份，点击跳转到城市所在位置
[] 支持展示有gps定位的图片

## License

[MIT](LICENSE.md)
