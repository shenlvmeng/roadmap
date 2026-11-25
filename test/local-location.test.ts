jest.mock("admin-tools/src/admin", () => ({
    "110000": {
        bbox: [115.4, 39.4, 117.6, 41.1],
        center: [116.405, 39.904],
        children: {},
        name: "北京市"
    },
    "410000": {
        bbox: [110.3, 31.3, 116.7, 36.4],
        center: [113.665, 34.758],
        children: {
            "411300": {
                bbox: [110.9, 32.2, 113.8, 33.8],
                center: [112.528, 32.99],
                children: {
                    "411381": {
                        bbox: [111.64, 32.377, 112.349, 32.996],
                        center: [112.092, 32.681],
                        name: "邓州市"
                    }
                },
                name: "南阳市"
            }
        },
        name: "河南省"
    },
    "420000": {
        bbox: [108.3, 29.0, 116.2, 33.3],
        center: [114.299, 30.585],
        children: {
            "420600": {
                bbox: [110.7, 31.2, 113.2, 32.6],
                center: [112.144, 32.042],
                children: {
                    "420625": {
                        bbox: [111.128, 31.879, 111.875, 32.498],
                        center: [111.64, 32.262],
                        name: "谷城县"
                    }
                },
                name: "襄阳市"
            }
        },
        name: "湖北省"
    }
}));

import { findLocationByName, reverseGeocode } from "../src/portal/local-location";

describe("local administrative location lookup", () => {
    it("finds a configured city without a map API", () => {
        const center = findLocationByName("北京");
        expect(center).toBeDefined();
        expect(center![0]).toBeGreaterThan(116);
        expect(center![0]).toBeLessThan(117);
        expect(center![1]).toBeGreaterThan(39);
        expect(center![1]).toBeLessThan(41);
    });

    it("resolves province and city locally", () => {
        const location = reverseGeocode(116.397, 39.908);
        expect(location.province).toBe("北京市");
        expect(location.city).toBe("北京市");
    });

    it("uses county data to disambiguate overlapping city bounds", () => {
        const location = reverseGeocode(111.83, 32.15);
        expect(location.province).toBe("湖北省");
        expect(location.city).toBe("襄阳市");
    });
});
