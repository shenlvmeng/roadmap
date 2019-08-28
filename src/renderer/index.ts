import $ from "jquery";
import fs from "fs";
import path from "path";
import writeFile from "write";
import rimraf from "rimraf";

import { convertGpxFiles } from "../main/gpx2json";
import { minifyImgs } from "./image";

import "./index.less";

const OUTPUT_ROOT_PATH = path.join(require("os").homedir(), "Desktop", "roadmap-output");
const OUTPUT_DATA_PATH = path.join(OUTPUT_ROOT_PATH, "data");
const OUTPUT_IMAGE_PATH = path.join(OUTPUT_DATA_PATH, "images");

let images: File[] = [];
let tracks: File[] = [];
let keys: string[] = [];
let titles: string[] = [];
let centralCity: string;
let pageTitle: string;

async function mkdirAsync(path: string) {
    return new Promise((res, rej) => {
        if (!path) {
            rej(Error("缺少文件夹路径"));
            return;
        }
        fs.mkdir(path, err => {
            if (err) {
                rej();
                return;
            }
            res();
        });
    });
}
function checkTitleImgCount() {
    const consistent = titles.length === images.length;
    if (!consistent) {
        $(".hint.warning").removeClass("hidden");
    } else {
        $(".hint.warning").addClass("hidden");
    }
    return consistent;
}

$(document).on("keyup", e => {
    keys.push(e.key);
    const currKeyStr = keys.join("");
    if (currKeyStr === "shenlvmeng") {
        $("section.images").removeClass("hidden");
        $(document).off("keyup");
    } else if (!"shenlvmeng".includes(keys.join(""))) {
        keys = [];
    }
});
// 自定义上传按钮
$("#upload-gpx").on("click", () => {
    $("#gps-track").click();
});
$("#upload-image").on("click", () => {
    $("#image").click();
});

$("#city").on("change", (e: JQuery.ChangeEvent<HTMLInputElement>) => {
    centralCity = e.currentTarget.value.trim();
});
$("#title").on("change", (e: JQuery.ChangeEvent<HTMLInputElement>) => {
    pageTitle = e.currentTarget.value.trim();
});
$("#image").on("change", async function() {
    images = $(this).prop("files");
    $("#image-length").text(`${images.length}个文件`);
    checkTitleImgCount();
});
$("#gps-track").on("change", async function() {
    tracks = $(this).prop("files");
    $("#gpx-length").text(`${tracks.length}个文件`);
});

$("#image-title").on("input", (e: JQuery.ChangeEvent<HTMLInputElement>) => {
    const titleStr: string = e.currentTarget.value.trim();
    titles = [...new Set(titleStr.split(/,|，/g))].filter(t => t);
    $("#image-titles").html(titles.map(title => `<span class="title-item">${title}.jpg</span>`).join(""));
    checkTitleImgCount();
});

async function generateImgs() {
    if (!images.length) {
        return;
    }
    if (!checkTitleImgCount()) {
        alert("标题数目和图片不一致，可能会影响展示效果");
    }
    await minifyImgs(Array.from(images), { width: 70 }, OUTPUT_IMAGE_PATH);
}

async function generateTracks() {
    if (!tracks.length) {
        alert("缺少gpx文件，请检查");
        throw Error("Empty gpx files");
    }
    await convertGpxFiles(Array.from(tracks).map(file => file.path), OUTPUT_DATA_PATH);
}

$("#generate").on("click", async () => {
    const isExist: boolean = await new Promise(res => {
        fs.access(OUTPUT_ROOT_PATH, err => {
            res(!err);
        });
    });
    // 清空已有目录
    if (isExist) {
        await new Promise((res, rej) => {
            rimraf(OUTPUT_ROOT_PATH, err => {
                if (err) {
                    rej(err);
                } else {
                    res();
                }
            });
        });
    }

    // 创建文件目录
    try {
        await mkdirAsync(OUTPUT_ROOT_PATH);
    } catch (err) {
        alert("output文件夹创建失败");
        return;
    }

    try {
        await mkdirAsync(OUTPUT_DATA_PATH);
        await mkdirAsync(OUTPUT_IMAGE_PATH);
    } catch (err) {
        alert("data、images文件夹已存在或权限不足");
        return;
    }
    // 生成
    await Promise.all([
        generateImgs(),
        generateTracks(),
        // 生成config文件
        writeFile.promise(
            path.join(OUTPUT_ROOT_PATH, "roadmap.config.json"),
            JSON.stringify(
                {
                    city: centralCity || "北京",
                    title: pageTitle || "我的路书",
                    gpxCount: tracks.length,
                    imgTitles: titles
                },
                null,
                "\t"
            )
        )
    ]);
    alert("生成完毕！请在桌面查看");
});
