// 本地坐标系互转，避免请求地图API的漫长时延
// 来源：http://www.oschina.net/code/snippet_260395_39205
// 感谢原作者！

const PI = 3.14159265358979324;
const x_pi = 3.14159265358979324 * 3000.0 / 180.0;

function delta(lat, lon) {
  // Krasovsky 1940
  //
  // a = 6378245.0, 1/f = 298.3
  // b = a * (1 - f)
  // ee = (a^2 - b^2) / a^2;
  const a = 6378245.0; //  a: 卫星椭球坐标投影到平面地图坐标系的投影因子。
  const ee = 0.00669342162296594323; //  ee: 椭球的偏心率。
  let dLat = transformLat(lon - 105.0, lat - 35.0);
  let dLon = transformLon(lon - 105.0, lat - 35.0);
  const radLat = lat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
  dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
  return {lat: dLat, lon: dLon};
}
 
//WGS-84 to GCJ-02
function gcj_encrypt (wgsLat, wgsLon) {
  if (outOfChina(wgsLat, wgsLon)) {
    return {lat: wgsLat, lon: wgsLon};
  }

  const d = delta(wgsLat, wgsLon);
  return {lat: wgsLat + d.lat, lon: wgsLon + d.lon};
}
//GCJ-02 to WGS-84
function gcj_decrypt (gcjLat, gcjLon) {
  if (outOfChina(gcjLat, gcjLon)) {
    return {lat: gcjLat, lon: gcjLon};
  }
   
  const d = delta(gcjLat, gcjLon);
  return {lat: gcjLat - d.lat, lon: gcjLon - d.lon};
}
//GCJ-02 to WGS-84 exactly
function gcj_decrypt_exact (gcjLat, gcjLon) {
  const initDelta = 0.01;
  const threshold = 0.000000001;
  let dLat = initDelta, dLon = initDelta;
  let mLat = gcjLat - dLat, mLon = gcjLon - dLon;
  let pLat = gcjLat + dLat, pLon = gcjLon + dLon;
  let wgsLat, wgsLon, i = 0;
  while (1) {
    wgsLat = (mLat + pLat) / 2;
    wgsLon = (mLon + pLon) / 2;
    let tmp = gcj_encrypt(wgsLat, wgsLon)
    dLat = tmp.lat - gcjLat;
    dLon = tmp.lon - gcjLon;
    if ((Math.abs(dLat) < threshold) && (Math.abs(dLon) < threshold)) {
      break;
    }

    if (dLat > 0) pLat = wgsLat; else mLat = wgsLat;
    if (dLon > 0) pLon = wgsLon; else mLon = wgsLon;

    if (++i > 10000) break;
  }
  //console.log(i);
  return {lat: wgsLat, lon: wgsLon};
}
//GCJ-02 to BD-09
function bd_encrypt (gcjLat, gcjLon) {
  const x = gcjLon, y = gcjLat;  
  const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);  
  const theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);  
  const bdLon = z * Math.cos(theta) + 0.0065;  
  const bdLat = z * Math.sin(theta) + 0.006; 
  return {lat: bdLat, lon: bdLon};
}
//BD-09 to GCJ-02
function bd_decrypt (bdLat, bdLon) {
  const x = bdLon - 0.0065, y = bdLat - 0.006;  
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);  
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);  
  const gcjLon = z * Math.cos(theta);  
  const gcjLat = z * Math.sin(theta);
  return {lat: gcjLat, lon: gcjLon};
}
//WGS-84 to Web mercator
//mercatorLat -> y mercatorLon -> x
function mercator_encrypt (wgsLat, wgsLon) {
  let x = wgsLon * 20037508.34 / 180.;
  let y = Math.log(Math.tan((90. + wgsLat) * PI / 360.)) / (PI / 180.);
  y = y * 20037508.34 / 180.;
  return {lat : y, lon: x};
  /*
  if ((Math.abs(wgsLon) > 180 || Math.abs(wgsLat) > 90))
      return null;
  var x = 6378137.0 * wgsLon * 0.017453292519943295;
  var a = wgsLat * 0.017453292519943295;
  var y = 3189068.5 * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)));
  return {'lat' : y, 'lon' : x};
  //*/
}
// Web mercator to WGS-84
// mercatorLat -> y mercatorLon -> x
function mercator_decrypt (mercatorLat, mercatorLon) {
  let x = mercatorLon / 20037508.34 * 180.;
  let y = mercatorLat / 20037508.34 * 180.;
  y = 180 / PI * (2 * Math.atan(Math.exp(y * PI / 180.)) - PI / 2);
  return {lat: y, lon: x};
  /*
  if (Math.abs(mercatorLon) < 180 && Math.abs(mercatorLat) < 90)
      return null;
  if ((Math.abs(mercatorLon) > 20037508.3427892) || (Math.abs(mercatorLat) > 20037508.3427892))
      return null;
  var a = mercatorLon / 6378137.0 * 57.295779513082323;
  var x = a - (Math.floor(((a + 180.0) / 360.0)) * 360.0);
  var y = (1.5707963267948966 - (2.0 * Math.atan(Math.exp((-1.0 * mercatorLat) / 6378137.0)))) * 57.295779513082323;
  return {'lat' : y, 'lon' : x};
  //*/
}
// two point's distance
function distance (latA, lonA, latB, lonB) {
  const earthR = 6371000.;
  const x = Math.cos(latA * PI / 180.) * Math.cos(latB * PI / 180.) * Math.cos((lonA - lonB) * PI / 180);
  const y = Math.sin(latA * PI / 180.) * Math.sin(latB * PI / 180.);
  let s = x + y;
  if (s > 1) s = 1;
  if (s < -1) s = -1;
  const alpha = Math.acos(s);
  const distance = alpha * earthR;
  return distance;
}
function outOfChina (lat, lon) {
    if (lon < 72.004 || lon > 137.8347) {
      return true;
    }
    if (lat < 0.8293 || lat > 55.8271) {
      return true;
    }
    return false;
}
function transformLat (x, y) {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
    return ret;
}
function transformLon (x, y) {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
    return ret;
}
function wgs2bd({lat, lon}) {
  let gcj = gcj_encrypt(lat, lon);
  return bd_encrypt(gcj.lat, gcj.lon);
}

module.exports = {
  wgs2bd
};