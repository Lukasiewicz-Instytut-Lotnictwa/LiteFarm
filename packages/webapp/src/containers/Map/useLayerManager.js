/*
 *  Copyright 2019, 2020, 2021, 2022 LiteFarm.org
 *  This file is part of LiteFarm.
 *
 *  LiteFarm is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  LiteFarm is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details, see <https://www.gnu.org/licenses/>.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { parseMapSourceURL } from '../../util/maps';

/**
 * Function that creates google.maps.ImageMapType for `XYZ` layer.
 * @param {google.maps} maps import Google Maps library
 * @param {string} url url pattern with placeholders for `x`, `y` and `z` as `{z}/{x}/{y}`
 * @param {string} [name] optional name of the layer
 * @param {number} [maxZoom] maximum zoom level
 * @param {number|[number, number]} [tileSize] size of map tile
 * @param {google.maps.ImageMapTypeOptions} [options] extra options
 * @return {google.maps.ImageMapType}
 */
export function createXYZLayer(maps, url, name, maxZoom, tileSize, options) {
  if (typeof tileSize === 'number') tileSize = [tileSize, tileSize];
  else if (Array.isArray(tileSize) && tileSize.length === 2) {
    // OK
  } else if (tileSize === null || tileSize === undefined)
    tileSize = [256, 256]; // Default if not provided
  else throw new Error('Invalid tileSize parameter.');

  if (typeof maxZoom !== 'number') {
    maxZoom = 18;
  }

  // https://developers.google.com/maps/documentation/javascript/reference/image-overlay#ImageMapType
  // https://developers.google.com/maps/documentation/javascript/reference/image-overlay#ImageMapTypeOptions
  return new maps.ImageMapType({
    getTileUrl: function (coord, zoom) {
      const tilesPerGlobe = 1 << zoom;
      let x = coord.x % tilesPerGlobe;
      if (x < 0) x = tilesPerGlobe + x;

      return url.replace(`{x}`, x).replace('{y}', coord.y).replace('{z}', zoom);
    },
    tileSize: new maps.Size(tileSize[0], tileSize[1]),
    name,
    maxZoom,
    ...options,
  });
}

/**
 * Create OpenStreetMaps layer. This is a default layer for the map.
 * @param {google.maps} maps import Google Maps library
 * @return {google.maps.ImageMapType}
 */
export function createOpenStreetMapsLayer(maps) {
  return createXYZLayer(maps, 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', 'OSM', 18, 256);
}

/* Code from https://github.com/googlemaps/js-ogc/blob/main/src/wmsmaptype.ts */
const DEFAULT_WMS_PARAMS = {
  request: 'GetMap',
  service: 'WMS',
  srs: 'EPSG:3857',
};
const EPSG_3857_EXTENT = 20037508.34789244;
const ORIG_X = -EPSG_3857_EXTENT; // x starts from right
const ORIG_Y = EPSG_3857_EXTENT; // y starts from top

function xyzToBounds(x, y, zoom) {
  const tileSize = (EPSG_3857_EXTENT * 2) / Math.pow(2, zoom);
  const minx = ORIG_X + x * tileSize;
  const maxx = ORIG_X + (x + 1) * tileSize;
  const miny = ORIG_Y - (y + 1) * tileSize;
  const maxy = ORIG_Y - y * tileSize;
  return [minx, miny, maxx, maxy];
}

function WmsMapType(
  maps,
  {
    url,
    layers,
    styles = '',
    bgcolor = '0xFFFFFF',
    version = '1.1.1',
    transparent = true,
    format = 'image/png',
    outline = false,
    // google.maps.ImageMapTypeOptions interface
    name,
    alt,
    maxZoom = 18,
    minZoom,
    opacity,
  },
) {
  // currently only support tileSize of 256
  const tileSize = new maps.Size(256, 256);

  const params = {
    layers,
    styles,
    version,
    transparent: String(transparent),
    bgcolor,
    format,
    outline: String(outline),
    width: String(tileSize.width),
    height: String(tileSize.height),
    ...DEFAULT_WMS_PARAMS,
  };

  if (url.slice(-1) !== '?') {
    url += '?';
  }

  const getTileUrl = function (coord, zoom) {
    return (
      url +
      new URLSearchParams({
        bbox: xyzToBounds(coord.x, coord.y, zoom).join(','),
        ...params,
      }).toString()
    );
  };

  return new maps.ImageMapType({
    getTileUrl,
    name,
    alt,
    opacity,
    maxZoom,
    minZoom,
    tileSize,
  });
}

/* End of copied code */

/**
 * Function to create for Google Maps JavaScript library WMS layer.
 * Code is based on [@googlemaps/ogc](https://github.com/googlemaps/js-ogc) library.
 * @param {google.maps} maps import Google Maps library
 * @param {string} url WMS layer URL
 * @param {string} layers WMS layers to be displayed
 * @param {string} [name] optional name of the layer
 * @param {number} [maxZoom] maximum zoom level
 * @param {import('@googlemaps/ogc').WmsMapTypeOptions} [options] extra options
 */
export function createWMSLayer(maps, url, layers, name, maxZoom, options) {
  return WmsMapType(maps, {
    url,
    layers,
    name,
    maxZoom,
    ...options,
  });
}

/**
 * Create layer from provided description.
 * @param {google.maps} maps import Google Maps library
 * @param {MapSourceSettings} source
 * @return {google.maps.ImageMapType|null} created layer or null if not supported
 **/
function createLayerFromSource(maps, source) {
  if (!source || typeof source !== 'object') return null; // Invalid source
  switch (source.service) {
    case 'XYZ':
      return createXYZLayer(maps, source.url, source.name, source.maxZoom, source.tileSize, {});
    case 'WMS':
      return createWMSLayer(maps, source.url, source.layers, source.name, source.maxZoom, {
        opacity: source.opacity,
      });
    default:
      console.warn('Unsupported map source: ', source.service);
      return null;
  }
}

/**
 * Helper function to parse multiple map sources provided as a single string separated by new lines.
 * @param {string} mapSources - The map sources string.
 * @returns {Array<Partial<MapSourceSettings>>} - Array of parsed map sources.
 **/
function parseMapSources(mapSources) {
  if (typeof mapSources !== 'string') return [];
  const sources = mapSources.split('\n');
  let parsed = [];
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i].trim();
    if (source.length === 0) continue; // Skip empty lines
    try {
      const p = parseMapSourceURL(source);
      parsed.push(p);
    } catch (e) {
      console.warn('Error parsing map source: ', source, e);
    }
  }
  return parsed;
}

const viteMapSources = parseMapSources(import.meta.env.VITE_MAP_SOURCES);

/**
 * @typedef {Object} LayerInfo
 * @property {Partial<MapSourceSettings>|null} source
 * @property {string} name
 * @property {string} label
 * @property {number} order
 * @property {string} [group]
 * @property {google.maps.ImageMapType|null} [layer]
 */

/**
 * @typedef {Object} LayersInfo
 * @property {Array<LayerInfo>} backgrounds
 * @property {Array<LayerInfo>} overlays
 */

/**
 * Function to create layer info from provided sources.
 * @param {Array<Partial<MapSourceSettings>>} sources
 * @returns {LayersInfo}
 */
function createLayerInfo(sources) {
  /** @type {Array<LayerInfo>} */
  let backgrounds = [
    {
      name: 'satellite',
      label: 'Satellite',
      order: -3,
      source: null,
      layer: null,
    },
    {
      name: 'roadmap',
      label: 'Roadmap',
      order: -2,
      source: null,
      layer: null,
    },
    {
      name: 'terrain',
      label: 'Terrain',
      order: -1,
      source: null,
      layer: null,
    },
  ];
  /** @type {Array<LayerInfo>} */
  let overlays = [];
  for (const source of sources) {
    if (source.kind === 'background') {
      backgrounds.push({
        name: source.name,
        label: source.label,
        order: source.order,
        source: source,
      });
    } else if (source.kind === 'transparent') {
      overlays.push({
        name: source.name,
        label: source.label,
        order: source.order,
        group: source.group,
        source: source,
      });
    }
  }
  backgrounds.sort((a, b) => a.order - b.order);
  overlays.sort((a, b) => a.order - b.order);
  return {
    backgrounds,
    overlays,
  };
}

/**
 * @typedef {Object} LayerManagerType
 * @property {LayersInfo} layers
 * @property {(map: google.maps.Map, maps: google.maps) => void} initLayerManager
 */

/**
 * Sync Google Map layers based on the filter state.
 * @param {google.maps.Map} map
 * @param {google.maps} maps
 * @param filterState
 * @param {LayersInfo} layers
 */
function syncGoogleMap(map, maps, filterState, layers) {
  // Control background layer of Google Map.
  let background = filterState.map_background;
  if (background === null || background === true) {
    background = maps.MapTypeId.SATELLITE;
  } else if (background === false) {
    background = maps.MapTypeId.ROADMAP;
  }
  map.setMapTypeId(background);

  // Get current state of overlay layers.
  const stateOverlays = {};
  for (const name of Object.keys(filterState)) {
    if (!name.startsWith('overlay_')) continue;
    const overlayName = name.substring('overlay_'.length);
    stateOverlays[overlayName] = filterState[name];
  }

  // Visible in map
  const mapOverlays = {};
  const toRemove = [];
  map.overlayMapTypes.forEach((layer, index) => {
    mapOverlays[layer.name] = true;
    if (stateOverlays[layer.name] !== true) {
      toRemove.push(index);
    }
  });
  // Sync state with visible layers
  // 1. Remove layers that are not in the state (in reverse order).
  for (let i = toRemove.length - 1; i >= 0; i--) {
    const index = toRemove[i];
    const removed = map.overlayMapTypes.removeAt(index);
    console.log('Layer removed: ', removed.name);
  }
  // 2. Add layers that are in the state but not in the map.
  for (const name of Object.keys(stateOverlays)) {
    if (!stateOverlays[name]) continue;
    if (mapOverlays[name]) continue; // Already in the map
    const layerInfo = layers.overlays.find((layer) => layer.name === name);
    if (!layerInfo) {
      console.warn('Layer not found: ', name);
      continue;
    }
    let layer = layerInfo.layer;
    if (!layer) {
      layer = createLayerFromSource(maps, layerInfo.source);
      if (layer) {
        layerInfo.layer = layer;
      } else {
        console.warn('Layer not created: ', layerInfo.source);
        continue;
      }
    }
    if (layer) {
      layer.name = name;
      map.overlayMapTypes.insertAt(0, layer);
      console.log('Layer added: ', layer.name);
    } else {
      console.warn('Layer not created: ', layerInfo.source);
    }
  }
}

/**
 * Hook for controlling map layers.
 * @return {LayerManagerType}
 */
export default function useLayerManager(filterState) {
  const [map, setMap] = useState(null);
  const [maps, setMaps] = useState(null);
  const mapState = useRef({});
  mapState.current = {
    map,
    maps,
  };

  const layers = useMemo(() => createLayerInfo(viteMapSources), []);

  useEffect(() => {
    /** @type {google.maps.Map} */
    const map = mapState.current.map;
    /** @type {google.maps} */
    const maps = mapState.current.maps;
    if (!map || !maps) return;
    syncGoogleMap(map, maps, filterState, layers);
  }, [filterState, mapState, layers]);

  return useMemo(
    () => ({
      layers,

      /**
       * @param {google.maps.Map} map
       * @param {google.maps} maps
       */
      initLayerManager: (map, maps) => {
        // console.log('initLayerManager', map, viteMapSources);
        setMap(map);
        setMaps(maps);
        // Register all background layers
        if (Array.isArray(viteMapSources)) {
          for (const source of viteMapSources) {
            // Register only background layers
            if (source.kind !== 'background') continue;

            const layer = createLayerFromSource(maps, source);
            if (layer && source.name) {
              try {
                map.mapTypes.set(source.name, layer);
                console.log('Layer added: ', source.name);
              } catch (e) {
                console.warn('Error adding layer: ', e);
                console.log(source, layer);
              }
            } else {
              console.warn('Layer not added: ', source);
            }
          }
        }
        // Setup initial state
        syncGoogleMap(map, maps, filterState, layers);
      },
    }),
    [setMap, setMaps, layers],
  );
}
