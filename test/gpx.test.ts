import { convert } from '../src/main/gpx2json';
import { bd2wgs, wgs2bd } from '../src/main/axis';
import * as path from 'path';

describe('gpx file to json test', () => {
    let track: any;
    it('can convert', async () => {
        const filePath = path.join(__dirname, './23km.gpx');
        track = JSON.parse(await convert(path.join(__dirname, './76km.gpx')));
        expect(track).not.toBeNull();
        track = JSON.parse(await convert(filePath));
        expect(track).not.toBeNull();
    });
    it('track has points, distance, startTime, duration', () => {
        expect(track.points.length).toBeDefined();
        expect(track.distance).toBeGreaterThan(23);
        expect(track.distance).toBeLessThan(24);
        expect(track.startTime).toBeGreaterThan(0);
        expect(track.duration).toBeGreaterThan(0);
    });
});

describe('test map axis convert', () => {
    let lat: number;
    let lon: number;
    beforeAll(async () => {
        const track = JSON.parse(await convert(path.join(__dirname, './23km.gpx')));
        const point = track.points[0];
        lat = point.lat;
        lon = point.lon;
    });

    it('convert successfully', () => {
        const wgs = bd2wgs({ lat, lon });
        const res = wgs2bd(wgs);
        expect(Math.abs(res.lat - lat)).toBeLessThan(0.0001);
        expect(Math.abs(res.lon - lon)).toBeLessThan(0.0001);
    });
});
