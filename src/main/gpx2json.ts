import gpxParse from "gpx-parse";
import writeFile from "write";
import * as path from "path";

import { wgs2bd } from "./axis";

interface TrackPoint {
    lat: number;
    elevation?: number;
    lon: number;
    timestamp: number;
}

export interface Track {
    points: TrackPoint[];
    distance: number;
    startTime: number;
    duration: number;
}

export async function convert(path: string) {
    if (!path) {
        throw Error("Gpx file path is required!");
    }
    let distance = 0;
    const res = await new Promise<TrackPoint[]>(resolve => {
        gpxParse.parseGpxFromFile(path, (err: Error, data: any) => {
            if (err || !data) {
                throw Error("文件内容错误");
            }
            const track: any[] = data.tracks;
            const flattenTrack: any[] = track.reduce(
                (acc: any, cur: any) =>
                    cur.segments.reduce((prev: any, curr: any) => prev.concat(curr), []).concat(acc),
                <any>[]
            );
            distance = track.reduce((prev: number, curr: any) => prev + curr.length(), 0);
            const points: TrackPoint[] = flattenTrack.map(t => {
                const { lat, lon, elevation, time } = t;
                const point = wgs2bd({ lat, lon });
                return {
                    lat: point.lat,
                    lon: point.lon,
                    elevation: elevation ? +elevation.toFixed(2) : 0,
                    timestamp: +time - 8 * 60 * 60 * 1000
                };
            });
            resolve(points);
        });
    });
    if (!res) {
        return JSON.stringify({
            points: [],
            distance: 0,
            startTime: 0,
            duration: 0
        });
    }

    const startTime = +new Date(res[0].timestamp);
    const duration = +new Date(res[res.length - 1].timestamp) - +new Date(res[0].timestamp);

    const track: Track = {
        distance,
        startTime,
        duration,
        points: res
    };
    return JSON.stringify(track);
}

/**
 * 批量转化gpx文件
 */
export async function convertGpxFiles(gpxPaths: string[], outputDir: string) {
    const jsons = await Promise.all(gpxPaths.map(path => convert(path)));
    await Promise.all(jsons.map((json, index) => writeFile.promise(path.join(outputDir, `./${index}.json`), json)));
}
