import { convert } from '../src/main/gpx2json';
import { wgs2bd } from '../src/main/axis';
import * as path from 'path';

describe('gpx file to json test', () => {
    let track: any;
    it('can convert', async () => {
        const filePath = path.join(__dirname, './23km.gpx');
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

describe('test baidu axis convert', () => {
    let lat: number;
    let lon: number;
    beforeAll(async () => {
        const track = JSON.parse(await convert(path.join(__dirname, './23km.gpx')));
        const point = track.points[0];
        lat = point.lat;
        lon = point.lon;
    });

    it('convert successfully', () => {
        const res = wgs2bd({ lat, lon });
        expect(res).not.toBeNull();
        expect(res.lat).toBeDefined();
        expect(res.lat).toBeDefined();
        expect(res.lat).not.toBeGreaterThan(90);
        expect(res.lat).not.toBeLessThan(-90);
        expect(res.lon).not.toBeGreaterThan(180);
        expect(res.lon).not.toBeLessThan(-180);
    });
});
