# traces-maker

> Start from [electron/electron-quick-start](https://github.com/electron/electron-quick-start)

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

- 展示所有轨迹的叠加
- 显示总里程、总时间
- 点击路线高亮整条路径，并显示对应运动详情
- 显示路径所在的所有城市和省份，点击跳转到城市所在位置
- 城市和省份显示部分可以关闭

## 学习资源

- [electron.atom.io/docs](http://electron.atom.io/docs) - all of Electron's documentation
- [electron.atom.io/community/#boilerplates](http://electron.atom.io/community/#boilerplates) - sample starter apps created by the community
- [electron/electron-quick-start](https://github.com/electron/electron-quick-start) - a very basic starter Electron app
- [electron/simple-samples](https://github.com/electron/simple-samples) - small applications with ideas for taking them further
- [electron/electron-api-demos](https://github.com/electron/electron-api-demos) - an Electron app that teaches you how to use Electron
- [hokein/electron-sample-apps](https://github.com/hokein/electron-sample-apps) - small demo apps for the various Electron APIs

## License

[MIT](LICENSE.md)
