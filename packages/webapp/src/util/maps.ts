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
 * Map source settings.
 */
export type MapSourceSettings = {
  /**
   * URL to the map source like WMS, WMTS oraz XYZ.
   */
  url: string;

  /**
   * Type of map source.
   */
  service: MapServiceType;

  /**
   * Kind of map layer.
   */
  kind: MapLayerKind;
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
 * from query part of the URL.
 * @param url - URL to the map source with optional query part parameters.
 * @returns Partial map source settings.
 */
export function parseMapSourceURL(url: string): Partial<MapSourceSettings> {
  const hashIndex = url.indexOf('#');
  const sp: URLSearchParams =
    hashIndex === -1 ? new URLSearchParams() : new URLSearchParams(url.substring(hashIndex + 1));

  let service: MapServiceType | undefined;
  let kind: MapLayerKind | undefined;

  // Get extra parameters from the URL fragment part.

  if (sp.has('service')) {
    let serviceParam = sp.get('service');
    sp.delete('service');
    if (serviceParam) {
      serviceParam = serviceParam.toUpperCase();
      if (serviceParam === 'WMS') service = 'WMS';
      else if (serviceParam === 'WMTS') service = 'WMTS';
      else if (serviceParam === 'XYZ') service = 'XYZ';
      else {
        console.warn(`Unknown map source type: ${serviceParam}`);
      }
    }
  }

  if (sp.has('type')) {
    let kindParam = sp.get('type');
    sp.delete('type');
    if (kindParam) {
      kindParam = kindParam.toLowerCase();
      if (kindParam === 'background') kind = 'background';
      else if (kindParam === 'transparent') kind = 'transparent';
      else {
        console.warn(`Unknown map layer kind: ${kindParam}`);
      }
    }
  }

  // Detect the map service type if it is not defined in the URL.
  if (!service) service = detectMapServiceType(url);

  return {
    url: hashIndex === -1 ? url : url.substring(0, hashIndex),
    service: service,
    kind: kind,
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
 * Function for extracting the map source settings from the WMS capabilities XML document.
 * This is a fallback function for the WMS map sources and may not cover all the cases.
 */
export function parseWMSCapabilities(xml: string) {
  const doc = parseXML(xml);
}
