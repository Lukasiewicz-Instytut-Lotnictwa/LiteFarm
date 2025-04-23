/*
 *  Copyright 2024 LiteFarm.org
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

/**
 * Type of map service.
 */
export type MapServiceType = 'WMS' | 'WMTS' | 'XYZ';

/**
 * Kind of map layer.
 * If the layer is background, it will be displayed below the transparent layers, and it will cover the whole map
 * therefore it should be used for base maps.
 *
 */
export type MapLayerKind = 'background' | 'transparent';

/**
 * Format of the map layer.
 */
export type MapLayerFormat = 'image/png' | 'image/jpeg' | 'image/svg+xml' | string;

/**
 * Map source settings.
 */
export type MapSourceSettings = {
  /**
   * Name/identifier of the map source.
   */
  name: string;

  /**
   * URL to the map source like WMS, WMTS oraz XYZ.
   */
  url: string;

  /**
   * Layers to be displayed on the map from WMS/WMTS.
   */
  layers?: string;

  /**
   * Type of map source.
   */
  service: MapServiceType;

  /**
   * Kind of map layer.
   */
  kind: MapLayerKind;

  /**
   * Override the default (WMS/WMTS) label of the map source.
   */
  label?: string;

  /**
   * Radio group for the map source.
   * It should be used for excluding layers from the same group.
   */
  group?: string;

  /**
   * Data format to be used for the map layer.
   */
  format?: MapLayerFormat;

  /**
   * Legend for this layer. This can be either a URL to the legend image, a base64 encoded image
   * or a HTML string with the legend content.
   * `false` if we don't want to display the legend.
   */
  legend?: string | false;

  /**
   * Maximum zoom level for the map source.
   */
  maxZoom?: number;

  /**
   * Size of the tile in pixels.
   */
  tileSize?: number | [number, number];

  /**
   * Order of the map source in the layer switcher.
   */
  order?: number;

  /**
   * Opacity of the map source.
   */
  opacity?: number;
};

/**
 * Helper function to detect the type of map source
 * base on the URL.
 * @param url - URL to the map source.
 * @returns Type of map source or undefined if the type is not recognized.
 */
export function detectMapServiceType(url: string): MapServiceType | undefined {
  // Check if the URL contains the placeholders for the XYZ type.
  if (url.includes('{x}') && url.includes('{y}') && url.includes('{z}')) return 'XYZ';
  // Simple check if the URL contains the WMS or WMTS.
  if (/[_/\d]wms([_/\d]|$)/i.test(url)) {
    return 'WMS';
  } else if (/[_/\d]wmts([_/\d]|$)/i.test(url)) {
    return 'WMTS';
  }
}

/**
 * Parse the map source URL and extract the map source settings
 * from hash part of the URL as a search params (URLSearchParams).
 * @param url - URL to the map source with optional query part parameters.
 * @returns Partial map source settings.
 */
export function parseMapSourceURL(url: string): Partial<MapSourceSettings> {
  const hashIndex = url.indexOf('#');
  const sp: URLSearchParams =
    hashIndex === -1 ? new URLSearchParams() : new URLSearchParams(url.substring(hashIndex + 1));

  let service: MapServiceType | undefined;
  let kind: MapLayerKind | undefined;
  let label: string | undefined;
  let group: string | undefined;
  let format: MapLayerFormat | undefined;
  let legend: string | false | undefined;
  let name: string | undefined;
  let layers: string | undefined;
  let maxZoom: number | undefined;
  let order: number = 0;
  let opacity: number | undefined;

  // Get extra parameters from the URL fragment part.
  for (const [key, value] of sp.entries()) {
    switch (key.toLowerCase()) {
      case 'service': {
        const serviceParam = value.toUpperCase();
        if (serviceParam === 'WMS') service = 'WMS';
        else if (serviceParam === 'WMTS') service = 'WMTS';
        else if (serviceParam === 'XYZ') service = 'XYZ';
        else {
          console.warn(`Unknown map source type: ${serviceParam}`);
        }
        break;
      }
      case 'type': {
        const kindParam = value.toLowerCase();
        if (kindParam === 'background') kind = 'background';
        else if (kindParam === 'transparent') kind = 'transparent';
        else {
          console.warn(`Unknown map layer kind: ${kindParam}`);
        }
        break;
      }
      case 'label':
        label = value;
        break;
      case 'name':
        name = value;
        break;
      case 'layers':
        layers = value;
        break;
      case 'group':
        group = value;
        break;
      case 'format':
        format = value as MapLayerFormat;
        break;
      case 'order': {
        const orderParam = parseInt(value);
        if (!isNaN(orderParam)) order = orderParam;
        break;
      }
      case 'opacity': {
        const opacityParam = parseFloat(value);
        if (!isNaN(opacityParam)) {
          opacity = opacityParam;
        }
        break;
      }
      case 'maxzoom':
        maxZoom = parseInt(value);
        break;
      case 'legend':
        if (
          value === 'false' ||
          value === '' ||
          value === '0' ||
          value === 'no' ||
          value === 'off'
        ) {
          legend = false;
        } else {
          legend = value;
        }
        break;
    }
  }

  // Detect the map service type if it is not defined in the URL.
  if (!service)
    service = detectMapServiceType(hashIndex === -1 ? url : url.substring(0, hashIndex));

  return {
    url: hashIndex === -1 ? url : url.substring(0, hashIndex),
    service: service,
    kind: kind,
    label: label,
    group: group,
    format: format,
    legend: legend,
    name: name,
    layers: layers,
    maxZoom: maxZoom,
    order: order,
    opacity: opacity,
  };
}

/**
 * Simple helper function to parse the XML string to the XML document with DOMParser.
 * @param xml - XML string.
 */
function parseXML(xml: string): XMLDocument {
  return new DOMParser().parseFromString(xml, 'application/xml');
}

/**
 * Get the root node name of the XML document.
 * @param doc - XML document.
 */
function getRootNodeName(doc: XMLDocument): string {
  return doc.documentElement.nodeName;
}

function getTextContent(list: NodeList | Array<Node>): Array<string> {
  let res: Array<string> = [];
  for (const node of list) {
    if (node.textContent) res.push(node.textContent);
  }

  return res;
}

function getImmediateNodes(node: Node, nodeName: string): Array<Node> {
  let res: Array<Node> = [];
  for (const child of node.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE && child.nodeName === nodeName) res.push(child);
  }

  return res;
}

function getImmediateNode(node: Node, nodeName: string): Node | undefined {
  for (const child of node.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE && child.nodeName === nodeName) return child;
  }
}

/**
 * Information about an layer extracted from the WMS/WMTS capabilities XML document.
 */
type CapabilitiesLayerInfo = {
  /**
   * Unique identifier of the layer for layer parameter in the WMS/WMTS requests.
   */
  identifier: string;
  /**
   * Title of the layer to be displayed in the layer switcher.
   */
  title?: string;
  /**
   * Abstract of the layer.
   */
  abstract?: string;
  /**
   * Supported formats for the layer. For example: `image/png`, `image/jpeg`, `image/svg+xml`.
   */
  formats?: Array<string>;
  /**
   * Supported SRS (Spatial Reference System) for the layer.
   * For example: `EPSG:4326`, `EPSG:3857`.
   */
  srs?: Array<string>;
};

/**
 * Information about the map source capabilities.
 */
type CapabilitiesInfo = {
  type: 'WMS' | 'WMTS';
  layers: Array<CapabilitiesLayerInfo>;
};

/**
 * Function for extracting the map source settings from the WMS capabilities XML document.
 * This is a fallback function for the WMS map sources and may not cover all the cases.
 */
export function parseWMSCapabilities(xml: string | XMLDocument): CapabilitiesInfo {
  const doc = typeof xml === 'string' ? parseXML(xml) : xml;
  let info: CapabilitiesInfo = {
    type: 'WMS',
    layers: [],
  };
  // Get all layer names from the XML document.
  // In WMS there can be multiple layers but not all of them are visible.
  const layers = doc.querySelectorAll('Layer > Name');
  for (const layerName of layers) {
    const layer = layerName.parentElement;
    if (!layer) continue;
    const identifier = getImmediateNode(layer, 'Name')?.textContent;
    const srs = getTextContent(getImmediateNodes(layer, 'SRS'));
    const title = getImmediateNode(layer, 'Title')?.textContent;
    const abstract = getImmediateNode(layer, 'Abstract')?.textContent;

    if (!identifier) continue;

    info.layers.push({
      identifier: identifier,
      title: title || undefined,
      abstract: abstract || undefined,
      srs: srs,
    });

    // console.log("WMS Layer: ", identifier, title, abstract, srs);
  }
  return info;
}

export function parseWMTSCapabilities(xml: string | XMLDocument): CapabilitiesInfo {
  const doc = typeof xml === 'string' ? parseXML(xml) : xml;
  let info: CapabilitiesInfo = {
    type: 'WMS',
    layers: [],
  };
  const layers = doc.querySelectorAll('Layer');
  for (const layer of layers) {
    // This will not work in JSDom
    const title = getImmediateNode(layer, 'Title')?.textContent;
    const abstract = getImmediateNode(layer, 'Abstract')?.textContent;
    const identifier = getImmediateNode(layer, 'Identifier')?.textContent;
    const format = getTextContent(getImmediateNodes(layer, 'Format'));
    const srs = getTextContent(layer.querySelectorAll('TileMatrixSetLink > TileMatrixSet'));
    if (!identifier) continue;

    // console.log("WMTS Layer: ", title, abstract, identifier, format, srs);
    // console.log(layer.textContent);
    info.layers.push({
      identifier: identifier,
      title: title || undefined,
      abstract: abstract || undefined,
      srs: srs,
      formats: format,
    });
  }
  return info;
}
