// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const path = require('path')
const gpxParse = require('gpx-parse')
const { remote } = require('electron')
const { wgs2bd } = require('./gps')
const { tmpl } = require('./utils')

const OUTPUT_PATH = 'output'

function serialize(file, index) {
  gpxParse.parseGpxFromFile(file.path, function(error, data) {
    if (error || !data.tracks) {
      alert('文件内容错误')
      return
    }
    const track = data.tracks;
    const flattenTrack = track.reduce((acc, cur) => (cur.segments.reduce((acc, cur) => acc.concat(cur), []).concat(acc)), [])
    const points = flattenTrack.map(wgs2bd).map(({lat, lon}) => ({lat, lng: lon}))
    try {
      const jsonData = JSON.stringify(points)
      const pathStr = path.join(OUTPUT_PATH, `${index}.json`)
      remote.require('fs').writeFile(pathStr, jsonData,'utf8', err => {
        if (err) throw err
      })
    } catch (e) {
      console.warn(e)
      alert('文件序列化失败')
    }
  });
}

document.getElementById('upload').addEventListener('click', () => {
  const fileList = document.getElementById('files').files
  const key = document.getElementById('ak').value.trim()
  const title = document.getElementById('title').value.trim() || "我的骑行记录"
  const city = document.getElementById('city').value.trim() || "北京"

  if (!key) {
    alert('您忘记填写ak秘钥了')
    return
  }

  remote.require('fs').mkdir(OUTPUT_PATH, 0o777, err => {
    if (err) {
      alert('文件夹创建失败，文件夹已存在或权限不够')
      return
    }
    // 生成模板HTML文件
    const template = document.getElementById('template').innerHTML
    const data = {
      title,
      length: fileList.length || 0,
      key,
      city
    }
    if (!data.length) {
      if (!confirm('并未上传gpx数据，是否继续？\n点击“取消”返回上传数据，点击“确认”继续操作。')) {
        return;
      }
    }
    Array.from(fileList).forEach(serialize)
    remote.require('fs').writeFile(path.join(OUTPUT_PATH, 'index.html'), tmpl(template)(data).replace(/&lt;/g, '<'),'utf8', err => {
      if (err) throw err
      else alert('生成完毕！将output文件夹下所有文件上传到服务器即可查看效果！')
    })
  })
})