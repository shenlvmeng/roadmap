import parseGpx from "parse-gpx";
import writeFile from "write";
import * as path from "path";

import { calcDistance } from "./axis";

interface RawTrackPoint {
    latitude: string;
    elevation: string;
    longitude: string;
    timestamp: string;
    heartrate?: string; // 心率
    cadence?: string; // 节奏
}

interface TrackPoint {
    latitude: number;
    elevation: number;
    longitude: number;
    timestamp: number;
}

interface Track {
    points: TrackPoint[];
    distance: number;
    startTime: number;
    duration: number;
}

export async function convert(path: string) {
    if (!path) {
        throw Error("Gpx file path is required!");
    }
    const res: RawTrackPoint[] = await parseGpx(path);
    if (!res) {
        return JSON.stringify({
            points: [],
            distance: 0,
            startTime: 0,
            duration: 0
        });
    }
    const points: TrackPoint[] = res.map(p => ({
        latitude: +p.latitude,
        longitude: +p.longitude,
        elevation: +(+p.elevation).toFixed(2),
        timestamp: +new Date(p.timestamp)
    }));

    const { distance } = points.reduce(
        (prev, curr) => {
            const delta = prev.lat ? calcDistance(prev.lat, prev.lon, curr.latitude, curr.longitude) : 0;
            return {
                distance: prev.distance + delta,
                lat: curr.latitude,
                lon: curr.longitude
            };
        },
        {
            distance: 0,
            lat: 0,
            lon: 0
        }
    );

    const startTime = +new Date(res[0].timestamp);
    const duration = +new Date(res[res.length - 1].timestamp) - +new Date(res[0].timestamp);

    const track: Track = {
        points,
        distance,
        startTime,
        duration
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
