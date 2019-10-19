declare var BMap: any;
declare var BMAP_NORMAL_MAP: any;
declare var BMAP_HYBRID_MAP: any;
declare var EXIF: any;

import { wgs2bd } from "../main/axis";
import { Track } from "../main/gpx2json";
import "./index.less";

let distance = 0;
let duration = 0;
let activePoly: any;
let map: any;
const provinces: string[] = [];
const cities: string[] = [];
let showImages = true;
let keys: string[] = [];

interface ImageInfo {
    title: string;
    vertical: boolean;
    time: string;
    altitude: number;
    latitude: number;
    longitude: number;
}
const imageInfo: ImageInfo[] = [];

// 工具方法
const $ = (selector: string) => document.querySelector(selector);

async function getJSON(path: string): Promise<any> {
    const request = new XMLHttpRequest();
    return new Promise((res, rej) => {
        request.open("GET", path);
        request.onload = () => res(JSON.parse(request.responseText));
        request.onerror = () => rej(request.statusText);
        request.send();
    });
}

function parseTime(time: number): string {
    if (time > 31536000) {
        return `${~~(time / 315636000)}年 ${parseTime(time % 31536000)}`;
    }
    if (time > 2592000) {
        return `${~~(time / 2592000)}月 ${parseTime(time % 2592000)}`;
    }
    if (time > 86400) {
        return `${~~(time / 86400)}天 ${parseTime(time % 86400)}`;
    }
    if (time > 3600) {
        return `${~~(time / 3600)}h ${parseTime(time % 3600)}`;
    }
    if (time > 60) {
        return `${~~(time / 60)}m ${parseTime(time % 60)}`;
    }
    return `${time.toFixed(0)}s`;
}

// 业务方法
function renderLocationList(addressComponents: any) {
    const city = addressComponents.city;
    const province = addressComponents.province;
    if (province && provinces.indexOf(province) === -1) {
        provinces.push(province);
    }
    if (city && cities.indexOf(city) === -1) {
        cities.push(city);
    }
    $("#provinces")!.innerHTML = provinces.map(p => p.slice(0, -1)).join(", ");
    $("#cities")!.innerHTML = cities.map(c => `<span class="city">${c.slice(0, -1)}</span>`).join(", ");
}
function clearActivePoly() {
    if (activePoly) {
        activePoly.setStrokeColor("#3a6bdb");
        $("#panel")!.className += " hide";
        activePoly = null;
    }
}
function updateStatistics() {
    $("#distance")!.innerHTML = distance.toFixed(3);
    $("#time")!.innerHTML = parseTime(duration / 1000);
}

async function paintTrack(index: number) {
    const track: Track = await getJSON(`./data/${index}.json`);
    distance += track.distance;
    duration += track.duration;
    const points = track.points.map(p => new BMap.Point(p.lon, p.lat));
    const polyline = new BMap.Polyline(points, {
        enableMassClear: false
    });
    polyline.metadata = {
        distance: track.distance,
        duration: track.duration,
        startTime: track.startTime
    };
    polyline.addEventListener("click", (event: any) => {
        clearActivePoly();
        event.target.setStrokeColor("#ed4040");
        const data = event.target.metadata;
        $("#curr_distance")!.innerHTML = data.distance.toFixed(3);
        $("#curr_time")!.innerHTML = parseTime(data.duration / 1000);
        $("#start_time")!.innerHTML = new Date(data.startTime).toLocaleString();
        $("#panel")!.className = "panel";
        activePoly = event.target;
        event.domEvent.stopPropagation();
    });
    map.addOverlay(polyline);
    // 取起点、中点、终点
    new BMap.Geocoder().getLocation(points[0], (res: any) => {
        renderLocationList(res.addressComponents);
    });
    new BMap.Geocoder().getLocation(points[~~(points.length / 2)], (res: any) => {
        renderLocationList(res.addressComponents);
    });
    new BMap.Geocoder().getLocation(points[points.length - 1], (res: any) => {
        renderLocationList(res.addressComponents);
    });
    updateStatistics();
}

function convertLocation(pos: [number, number, number]) {
    return pos[0] + pos[1] / 60 + pos[2] / 3600;
}

function drawImage() {
    imageInfo.forEach(img => {
        const correctPoint = wgs2bd({ lat: img.latitude, lon: img.longitude });
        const point = new BMap.Point(correctPoint.lon, correctPoint.lat);
        const text = `<div class="shortcut" title="摄于${img.time}" data-key="${img.title}">
            <img src='./data/images/${img.title}.jpg' />
            <p>海拔 ${img.altitude.toFixed(1)}m</p>
        </div>`;
        const label = new BMap.Label(text, {
            position: point,
            offset: new BMap.Size(-38, img.vertical ? -134 : -90)
        });
        map.addOverlay(label);
    });
}
function keyUp(e: KeyboardEvent) {
    keys.push(e.key);
    const currKeyStr = keys.join("");
    if (currKeyStr === "shenlvmeng") {
        $("#toggle")!.classList.remove("hidden");
        document.removeEventListener("keyup", keyUp);
    } else if (!"shenlvmeng".includes(keys.join(""))) {
        keys = [];
    }
}

interface Config {
    city: string;
    title: string;
    gpxCount: number;
    imgTitles?: string[];
}

async function run() {
    const config: Config = await getJSON("./roadmap.config.json");
    const { city, title, gpxCount, imgTitles = [] } = config;
    if (!city || !title || !gpxCount) {
        throw Error("roadmap.config.json格式错误");
    }
    document.title = title || "我的路书";
    // 初始化地图
    map = new BMap.Map("map");
    map.centerAndZoom(city || "北京");
    map.addControl(
        new BMap.MapTypeControl({
            mapTypes: [BMAP_NORMAL_MAP, BMAP_HYBRID_MAP]
        })
    );
    map.enableScrollWheelZoom(true);
    map.addEventListener("click", () => {
        clearActivePoly();
    });
    $("#cities")!.addEventListener("click", (event: any) => {
        if ((event.target.className = "city")) {
            map.centerAndZoom(event.target.innerText);
        }
    });
    $("#close")!.addEventListener("click", (event: any) => {
        event.target.parentNode.className += " hide";
    });
    // 绘制折线
    for (let i = 0; i < gpxCount; i += 1) {
        paintTrack(i);
    }

    // 照片部分
    if (!imgTitles.length) {
        return;
    }
    // 读取信息
    await Promise.all(
        imgTitles.map(title => {
            return new Promise(res => {
                const image = new Image();
                image.src = `./data/images/${title}.jpg`;
                image.onload = () => {
                    EXIF.getData(image, function(this: any) {
                        if (!EXIF.getTag(this, "GPSLatitude")) {
                            res();
                            return;
                        }
                        imageInfo.push({
                            title,
                            vertical: this.height >= 150,
                            time: EXIF.getTag(this, "DateTime"),
                            altitude: EXIF.getTag(this, "GPSAltitude").valueOf(),
                            latitude: convertLocation(EXIF.getTag(this, "GPSLatitude")),
                            longitude: convertLocation(EXIF.getTag(this, "GPSLongitude"))
                        });
                        res();
                    });
                };
            });
        })
    );
    // 绘制照片
    drawImage();
    $("#map")!.addEventListener("click", (e: any) => {
        let t = e.target;
        if (!t.dataset.key) {
            t = t.parentNode;
        }
        if (t.dataset.key) {
            let info: any;
            imageInfo.forEach(imgInfo => {
                if (imgInfo.title === t.dataset.key) {
                    info = imgInfo;
                }
            });
            if (!info) {
                return;
            }
            $("#modal")!.classList.remove("invisible");
            $("#altitude")!.innerHTML = info.altitude.toFixed(3);
            $("#longitude")!.innerHTML = info.longitude.toFixed(5);
            $("#latitude")!.innerHTML = info.latitude.toFixed(5);
            ($("#photo") as HTMLImageElement).src = `https://s2.ax1x.com/${t.dataset.key.replace(/-/g, "/")}.jpg`;
            $("#create-time")!.innerHTML = `${info.time.slice(0, 11).replace(/:/g, "-")}${info.time.slice(11)}`;
        }
    });
    $("#hide")!.addEventListener("click", () => {
        $("#modal")!.classList.add("invisible");
    });

    document.addEventListener("keyup", keyUp);
    $("#toggle")!.addEventListener("click", () => {
        showImages = !showImages;
        $("#toggle")!.innerHTML = showImages ? "关闭图片展示" : "开启图片展示";
        $("#toggle")!.className = showImages ? "toggle-images disable" : "toggle-images enable";
        showImages ? drawImage() : map.clearOverlays();
    });
}

run();
