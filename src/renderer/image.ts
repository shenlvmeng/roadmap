/**
 * online work in electron environment
 * need both Web API and node API
 */
import * as path from "path";
import writeFile from "write";

const B64_PREFIX = "data:image/jpeg;base64,";
/**
 * @description 为图片分片，便于确定EXIF信息
 * @param rawImage 二进制文件
 */
async function getSegments(rawImage: ArrayBuffer | Blob): Promise<number[][]> {
    if (rawImage instanceof Blob) {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = async () => {
                resolve(await getSegments(reader.result as ArrayBuffer));
            };
            reader.readAsArrayBuffer(rawImage);
        });
    }
    if (!rawImage.byteLength) {
        return [];
    }
    let head = 0;
    let tail = 0;
    const segments: number[][] = [];
    let length = 0;
    let seg: number[];

    const arr = Array.from(new Uint8Array(rawImage));
    while (true) {
        // Start of Scan 0xff 0xda  SOS
        if (arr[head] === 0xff && arr[head + 1] === 0xda) {
            break;
        }

        // Start of Image 0xff 0xd8  SOI
        if (arr[head] === 0xff && arr[head + 1] === 0xd8) {
            head += 2;
        } else {
            // 找到每个marker
            // 每个marker 后 的两个字节为 该marker信息的长度
            length = arr[head + 2] * 256 + arr[head + 3];
            tail = head + length + 2;
            seg = arr.slice(head, tail); // 截取信息
            head = tail;
            segments.push(seg); // 将每个marker + 信息push进去。
        }
        if (head > arr.length) {
            break;
        }
    }
    return new Promise(resolve => {
        resolve(segments);
    });
}

/**
 * @description 从解析好的segments中读取EXIF信息
 * @param segments
 */
function getEXIF(segments: number[][]) {
    if (!segments.length) {
        return [];
    }
    let seg: number[] = [];
    segments.forEach(s => {
        // app1 exif 0xff 0xe1
        if (s[0] === 0xff && s[1] === 0xe1) {
            seg = seg.concat(s);
        }
    });
    return seg;
}

/**
 * @description 插入EXIF信息到压缩后的图片中
 * @param resizedImg
 * @param exifArr
 */
function insertEXIF(resizedImg: ArrayBuffer, exifArr: number[]) {
    const arr = Array.from(new Uint8Array(resizedImg));
    if (arr[2] !== 0xff || arr[3] !== 0xe0) {
        throw Error("不是标准的JPEG文件");
    }
    // APP0长度
    const length = arr[4] * 256 + arr[5];
    // 合并文件 SOI + EXIF + 去除APP0的图像信息
    const newImg = [0xff, 0xd8].concat(exifArr, arr.slice(4 + length));
    return new Uint8Array(newImg);
}

interface ImgOption {
    width: number;
    height: number;
    quality: number;
}

/**
 * @description 压缩图片尺寸大小
 * @param img
 * @param option 压缩参数
 * @param callback 成功回调
 */
function imageResize(img: HTMLImageElement, option: ImgOption, callback: (img: Blob) => void) {
    // jpeg格式才可以维持之前的EXIF信息
    const type = "image/jpeg";
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const { width, height, quality } = option;
    canvas.width = width;
    canvas.height = height;
    ctx!.drawImage(img, 0, 0, width, height);
    canvas.toBlob(callback, type, quality);
}

interface MinifyOption {
    width: number;
    height?: number;
    quality?: number;
}

async function minifySimpleImg(file: Blob, option: MinifyOption): Promise<Uint8Array> {
    if (option.width <= 0) {
        throw Error("非法的宽度");
    }
    const reader = new FileReader();
    const imgDom = new Image();
    return new Promise(resolve => {
        reader.onload = () => {
            const dataUrl = reader.result as string;
            imgDom.src = dataUrl;
            imgDom.onload = function() {
                imageResize(
                    imgDom,
                    {
                        width: option.width,
                        height: option.height || (imgDom.height * option.width) / imgDom.width,
                        quality: option.quality || 1
                    },
                    blob => {
                        const reader2 = new FileReader();
                        reader2.onload = async () => {
                            // 从原始图片中
                            const segments = await getSegments(file);
                            const exif = getEXIF(segments);

                            // const newImgBlob = new Blob(
                            //     [insertEXIF(reader2.result as ArrayBuffer, exif)],
                            //     { type: "image/jpeg" }
                            // );
                            // resolve(newImgBlob);
                            resolve(insertEXIF(reader2.result as ArrayBuffer, exif));
                        };
                        reader2.readAsArrayBuffer(blob);
                    }
                );
            };
        };
        reader.readAsDataURL(file);
    });
}

export async function minifyImgs(files: Blob[], option: MinifyOption, dir: string) {
    const minifiedImg = await Promise.all(files.map(file => minifySimpleImg(file, option)));
    await Promise.all(minifiedImg.map((uint8, index) => writeFile.promise(path.join(dir, `./${index}.jpg`), uint8)));
}

/**
 * @description decode base64 string to Uint8array
 * @param base64
 */
export function decode64(base64: string) {
    if (base64.slice(0, 23) !== B64_PREFIX) {
        return [];
    }
    const binStr = atob(base64.replace(B64_PREFIX, ""));
    const buf = new Uint8Array(binStr.length);
    [...Array(binStr.length)].forEach((_, i) => {
        buf[i] = binStr.charCodeAt(i);
    });
    return Array.from(buf);
}

/**
 * @description encode Uint8array to base64 string
 * @param arr
 */
export function encode64(arr: number[]) {
    let data = "";
    arr.forEach(val => {
        data += String.fromCharCode(val);
    });
    return `${B64_PREFIX}${btoa(data)}`;
}
