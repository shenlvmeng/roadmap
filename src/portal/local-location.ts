import AdminDictionary from "admin-tools/src/admin";

interface AdminNode {
    bbox: number[];
    center: number[];
    children?: { [code: string]: AdminNode };
    name: string;
}

interface LocationRecord {
    bbox: number[];
    center: number[];
    city: string;
    name: string;
    province: string;
}

interface AddressComponents {
    city: string;
    province: string;
}

const MUNICIPALITIES = ["北京市", "天津市", "上海市", "重庆市"];
const provinces: LocationRecord[] = [];
const cities: LocationRecord[] = [];
const areas: LocationRecord[] = [];

function getArea(bbox: number[]): number {
    return Math.abs((bbox[2] - bbox[0]) * (bbox[3] - bbox[1]));
}

function contains(bbox: number[], longitude: number, latitude: number): boolean {
    return longitude >= bbox[0] && longitude <= bbox[2] && latitude >= bbox[1] && latitude <= bbox[3];
}

function normalizeName(name: string): string {
    return name.trim().replace(/(特别行政区|壮族自治区|回族自治区|维吾尔自治区|自治区|自治州|地区|盟|省|市)$/g, "");
}

Object.keys(AdminDictionary).forEach(provinceCode => {
    const province = (AdminDictionary as { [code: string]: AdminNode })[provinceCode];
    provinces.push({
        bbox: province.bbox,
        center: province.center,
        city: "",
        name: province.name,
        province: province.name
    });

    if (MUNICIPALITIES.indexOf(province.name) !== -1) {
        cities.push({
            bbox: province.bbox,
            center: province.center,
            city: province.name,
            name: province.name,
            province: province.name
        });
        const areaCodes = Object.keys(province.children || {});
        areaCodes.forEach(areaCode => {
            const area = province.children![areaCode];
            areas.push({
                bbox: area.bbox,
                center: area.center,
                city: province.name,
                name: area.name,
                province: province.name
            });
        });
        if (!areaCodes.length) {
            areas.push({
                bbox: province.bbox,
                center: province.center,
                city: province.name,
                name: province.name,
                province: province.name
            });
        }
        return;
    }

    Object.keys(province.children || {}).forEach(cityCode => {
        const city = province.children![cityCode];
        cities.push({
            bbox: city.bbox,
            center: city.center,
            city: city.name,
            name: city.name,
            province: province.name
        });
        if (city.children) {
            Object.keys(city.children).forEach(areaCode => {
                const area = city.children![areaCode];
                areas.push({
                    bbox: area.bbox,
                    center: area.center,
                    city: city.name,
                    name: area.name,
                    province: province.name
                });
            });
        } else {
            areas.push({
                bbox: city.bbox,
                center: city.center,
                city: city.name,
                name: city.name,
                province: province.name
            });
        }
    });
});

function findContaining(records: LocationRecord[], longitude: number, latitude: number): LocationRecord | undefined {
    const matches = records.filter(record => contains(record.bbox, longitude, latitude));
    matches.sort((left, right) => getArea(left.bbox) - getArea(right.bbox));
    return matches[0];
}

function findNearest(records: LocationRecord[], longitude: number, latitude: number): LocationRecord | undefined {
    let nearest: LocationRecord | undefined;
    let nearestDistance = Infinity;
    records.forEach(record => {
        const latitudeScale = Math.cos((latitude * Math.PI) / 180);
        const longitudeDelta = (record.center[0] - longitude) * latitudeScale;
        const latitudeDelta = record.center[1] - latitude;
        const distance = longitudeDelta * longitudeDelta + latitudeDelta * latitudeDelta;
        if (distance < nearestDistance) {
            nearest = record;
            nearestDistance = distance;
        }
    });
    return nearest;
}

export function findLocationByName(name: string): number[] | undefined {
    const normalizedName = normalizeName(name);
    const record = cities.concat(provinces).find(item => normalizeName(item.name) === normalizedName);
    return record ? record.center : undefined;
}

export function reverseGeocode(longitude: number, latitude: number): AddressComponents {
    if (longitude < 72 || longitude > 138 || latitude < 0.8 || latitude > 56) {
        return {
            city: "",
            province: ""
        };
    }

    const containingAreas = areas.filter(area => contains(area.bbox, longitude, latitude));
    const area = findNearest(containingAreas.length ? containingAreas : areas, longitude, latitude);
    if (area) {
        return {
            city: area.city,
            province: area.province
        };
    }

    const province = findContaining(provinces, longitude, latitude) || findNearest(provinces, longitude, latitude);
    const cityCandidates = province ? cities.filter(city => city.province === province.province) : cities;
    const city =
        findContaining(cityCandidates, longitude, latitude) || findNearest(cityCandidates, longitude, latitude);
    return {
        city: city ? city.city : "",
        province: province ? province.province : ""
    };
}
