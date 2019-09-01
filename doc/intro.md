# 工程化改造

1.0.0项目由两部分组成：**Electron程序**、**web网页**。两者不直接关联，通过配置文件`roadmap.config.json`解耦。

另外，Electron程序和web网页属于两套开发流程，互不干扰，在使用配置文件作为接口的基础上，可以独立开发和升级。

## Electron程序

提供给用户程序，通过输入地图配置、gpx文件、定位图片物料，产出`roadmap.config.json`。整体使用Electron + webpack + TypeScript的脚手架。

Electron工作重点在gpx文件转换和图片压缩：

- gpx文件使用`parse-gpx`库解析，产出JSON字符串
- 图片压缩，保留EXIF信息的图片压缩，产出压缩后的图片

最后加上用户的输入，综合产出`roadmap.config.json`。

### gpx解析

> 见src/main/gpx2json.ts

使用`parse-gpx`库解析，将经纬度坐标换算到百度地图坐标，产出保留经纬度、海拔信息的结构体，储存为JSON文件，便于网页读取。

### 图片压缩

> 见src/renderer/image.ts

带有EXIF信息的图片通常体积很大，不适合直接放在网页，会严重拖慢网页加载速度。而经过调研，常见的图片压缩工具都不会保留图片EXIF信息，即使保留也不会保留我们需要的经纬度、海拔信息。

另外，满足要求的图片压缩工具（如Adobe PhotoShop）没法整合在整个流程中。因此需要自己实现。

思路是：

- 读取原始图片中的EXIF信息
- 借助canvas压缩图片体积、同时调整图片尺寸
- 再度组合EXIF信息和压缩后的图片，得到保留完整EXIF信息的压缩图片

### 网页模板

使用`html-loader`加载已经产出好的`output.html`，读取为字符串，直接输出到指定目录即可。

网页模板的开发流程见portal一节。

### 产物

> 样例见src/test/portal

产物生成在桌面的roadmap-output文件夹，**新生成的文件夹会覆盖老的**。内容如下：

- `index.html` 目标网页
- `roadmap.config.json` 配置信息
- `data`
  - `xx.json` gpx内容
  - `images` 图片信息

## roadmap.config.json

用于解耦。包含了基础的配置信息

- city 默认定位的中心城市
- title 网页标题
- gpxCount gpx路径数
- imgTitles 图片标题，不需要和图片一一对应

## web网页（portal）

web网页为了便于迭代，使用了和Electron程序独立的webpack工程。在`config`中有独立的webpack配置，有独立的webpack调试、打包命令。

工程位于`src/portal`，使用TypeScript。产物位于`portal`目录下，由Electron程序引用。

在portal工程的webpack配置中：

- 使用`MiniCssExtractPlugin`抽出css为css资源文件，加载时的避免样式闪动
- 使用`HtmlWebpackInlineSourcePlugin`将引用的css和js文件inline，使得Electron程序只需引用一个HTML文件即可
- 需要配置html-loader的`attr`，避免web网页在加载时，里面的`<img>`标签的`src`属性被解析

### gps轨迹

使用百度地图API绘制polyline实现，Electron程序生成的JSON中，已经提前转成百度地图坐标地址。

### 图床

图片存储于免费的[路过图床](https://imgchr.com)，因为不支持自定义访问路径，因此需要将上传图床后的路径保存为图片的title，在网页加载时，通过压缩图的title找到图片在图床上的对应地址（这个地方的设计待优化，所以暂时未开放）。

图片的位置使用EXIF.js读取压缩图片的EXIF信息拿到，转换坐标后绘制在地图上。
