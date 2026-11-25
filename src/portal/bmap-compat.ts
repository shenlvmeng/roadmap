import { bd2wgs } from "../main/axis";
import { findLocationByName, reverseGeocode } from "./local-location";

declare var maplibregl: any;

interface Coordinate {
    lat: number;
    lon: number;
}

interface Overlay {
    enableMassClear: boolean;
    addTo(map: RoadmapMap): void;
    remove(): void;
}

const DEFAULT_CENTER = [116.397, 39.908];
const DEFAULT_ZOOM = 11;
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
let overlayId = 0;

function nextOverlayId(prefix: string): string {
    overlayId += 1;
    return `${prefix}-${overlayId}`;
}

function bd09ToWgs84(point: Point): Coordinate {
    return bd2wgs({
        lat: point.lat,
        lon: point.lng
    });
}

class Point {
    public lng: number;
    public lat: number;

    constructor(lng: number, lat: number) {
        this.lng = lng;
        this.lat = lat;
    }
}

class Size {
    public width: number;
    public height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }
}

class RoadmapMap {
    public rawMap: any;
    private overlays: Overlay[] = [];
    private ready = false;
    private readyTasks: (() => void)[] = [];

    constructor(container: string) {
        if (typeof maplibregl === "undefined") {
            throw Error("MapLibre GL JS 加载失败，请检查网络连接");
        }
        this.rawMap = new maplibregl.Map({
            container,
            attributionControl: true,
            center: DEFAULT_CENTER,
            style: MAP_STYLE,
            zoom: DEFAULT_ZOOM
        });
        this.rawMap.addControl(new maplibregl.NavigationControl(), "top-right");
        this.rawMap.on("load", () => {
            this.ready = true;
            this.readyTasks.splice(0).forEach(task => task());
        });
    }

    public whenReady(task: () => void): void {
        if (this.ready) {
            task();
            return;
        }
        this.readyTasks.push(task);
    }

    public centerAndZoom(location: string | Point, zoom: number = DEFAULT_ZOOM): void {
        if (typeof location === "string") {
            const center = findLocationByName(location);
            this.rawMap.jumpTo({
                zoom,
                center: center ? center : DEFAULT_CENTER
            });
            return;
        }
        const center = bd09ToWgs84(location);
        this.rawMap.jumpTo({
            zoom,
            center: [center.lon, center.lat]
        });
    }

    public addControl(_control: MapTypeControl): void {
        // MapLibre/OpenFreeMap only exposes the normal vector basemap.
    }

    public enableScrollWheelZoom(enabled: boolean): void {
        if (enabled) {
            this.rawMap.scrollZoom.enable();
        } else {
            this.rawMap.scrollZoom.disable();
        }
    }

    public addEventListener(type: string, handler: (event: any) => void): void {
        this.rawMap.on(type, (event: any) => {
            if (event.originalEvent && event.originalEvent.__roadmapOverlayHandled) {
                return;
            }
            handler(event);
        });
    }

    public addOverlay(overlay: Overlay): void {
        this.overlays.push(overlay);
        overlay.addTo(this);
    }

    public clearOverlays(): void {
        this.overlays = this.overlays.filter(overlay => {
            if (!overlay.enableMassClear) {
                return true;
            }
            overlay.remove();
            return false;
        });
    }
}

class Polyline implements Overlay {
    public enableMassClear: boolean;
    public metadata: any;
    private points: Point[];
    private color = "#3a6bdb";
    private id = nextOverlayId("track");
    private map?: RoadmapMap;
    private eventHandlers: { [type: string]: ((event: any) => void)[] } = {};

    constructor(points: Point[], options: { enableMassClear?: boolean } = {}) {
        this.points = points;
        this.enableMassClear = options.enableMassClear !== false;
    }

    public addEventListener(type: string, handler: (event: any) => void): void {
        if (!this.eventHandlers[type]) {
            this.eventHandlers[type] = [];
        }
        this.eventHandlers[type].push(handler);
    }

    public setStrokeColor(color: string): void {
        this.color = color;
        if (this.map && this.map.rawMap.getLayer(this.id)) {
            this.map.rawMap.setPaintProperty(this.id, "line-color", color);
        }
    }

    public addTo(map: RoadmapMap): void {
        this.map = map;
        map.whenReady(() => {
            const coordinates = this.points.map(point => {
                const location = bd09ToWgs84(point);
                return [location.lon, location.lat];
            });
            map.rawMap.addSource(this.id, {
                data: {
                    geometry: {
                        coordinates,
                        type: "LineString"
                    },
                    properties: {},
                    type: "Feature"
                },
                type: "geojson"
            });
            map.rawMap.addLayer({
                id: this.id,
                layout: {
                    "line-cap": "round",
                    "line-join": "round"
                },
                paint: {
                    "line-color": this.color,
                    "line-opacity": 0.9,
                    "line-width": 4
                },
                source: this.id,
                type: "line"
            });
            map.rawMap.on("click", this.id, (event: any) => {
                const domEvent = {
                    stopPropagation: () => {
                        if (event.originalEvent) {
                            event.originalEvent.__roadmapOverlayHandled = true;
                            event.originalEvent.stopPropagation();
                        }
                    }
                };
                (this.eventHandlers.click || []).forEach(handler =>
                    handler({
                        domEvent,
                        target: this
                    })
                );
            });
            map.rawMap.on("mouseenter", this.id, () => {
                map.rawMap.getCanvas().style.cursor = "pointer";
            });
            map.rawMap.on("mouseleave", this.id, () => {
                map.rawMap.getCanvas().style.cursor = "";
            });
        });
    }

    public remove(): void {
        if (!this.map) {
            return;
        }
        if (this.map.rawMap.getLayer(this.id)) {
            this.map.rawMap.removeLayer(this.id);
        }
        if (this.map.rawMap.getSource(this.id)) {
            this.map.rawMap.removeSource(this.id);
        }
    }
}

class Label implements Overlay {
    public enableMassClear = true;
    private content: string;
    private position: Point;
    private offset: Size;
    private marker: any;

    constructor(content: string, options: { position: Point; offset: Size }) {
        this.content = content;
        this.position = options.position;
        this.offset = options.offset;
    }

    public addTo(map: RoadmapMap): void {
        map.whenReady(() => {
            const location = bd09ToWgs84(this.position);
            const element = document.createElement("div");
            element.className = "BMapLabel";
            element.innerHTML = this.content;
            this.marker = new maplibregl.Marker({
                element,
                anchor: "top-left",
                offset: [this.offset.width, this.offset.height]
            })
                .setLngLat([location.lon, location.lat])
                .addTo(map.rawMap);
        });
    }

    public remove(): void {
        if (this.marker) {
            this.marker.remove();
            this.marker = null;
        }
    }
}

class Geocoder {
    public getLocation(point: Point, callback: (result: any) => void): void {
        const location = bd09ToWgs84(point);
        const addressComponents = reverseGeocode(location.lon, location.lat);
        setTimeout(() => callback({ addressComponents }), 0);
    }
}

class MapTypeControl {
    constructor(_options: any) {
        // Kept for compatibility with the previous BMap call site.
    }
}

(window as any).BMap = {
    Geocoder,
    Label,
    MapTypeControl,
    Point,
    Polyline,
    Size,
    Map: RoadmapMap
};
(window as any).BMAP_NORMAL_MAP = "normal";
