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

import { detectMapServiceType, parseMapSourceURL } from '../util/maps';
import { expect, describe, test, vi } from 'vitest';

// Test XML string for WMS Capabilities
const WMS_CAPABILITIES_1 = `
<?xml version="1.0" encoding="UTF-8"?>

<!DOCTYPE WMT_MS_Capabilities SYSTEM "http://schemas.opengis.net/wms/1.1.1/WMS_MS_Capabilities.dtd">
<WMT_MS_Capabilities version="1.1.1">
\t<Service>
\t\t<Name>OGC:WMS</Name>
\t\t<Title>Usługa przeglądania (WMS) ortofotomap dla obszaru Polski</Title>
\t\t<Abstract>Usługa przeglądania (Web Map Service,WMS) umożliwiająca przeglądanie ortofotomap dla obszaru Polski. Dane udostępniane za pomocą tej usługi stanowią ortofotomapę wykonaną ze zdjęć lotniczych. Usługa oferuje wsparcie dla interfejsu WMS 1.1.1.</Abstract>
\t\t<KeywordList>
\t\t\t<Keyword>WMS</Keyword>
\t\t\t<Keyword>Usługa przeglądania</Keyword>
\t\t\t<Keyword>View service</Keyword>
\t\t\t<Keyword>Web Map Service</Keyword>
\t\t\t<Keyword>Aerial ortoimagery</Keyword>
\t\t\t<Keyword>Aerial photography</Keyword>
\t\t\t<Keyword>Dane referencyjne</Keyword>
\t\t\t<Keyword>Fotografia terenu</Keyword>
\t\t\t<Keyword>Land image</Keyword>
\t\t\t<Keyword>Land photography</Keyword>
\t\t\t<Keyword>Obraz terenu</Keyword>
\t\t\t<Keyword>Orthoimagery</Keyword>
\t\t\t<Keyword>Ortofotogram</Keyword>
\t\t\t<Keyword>Ortofotomapa lotnicza</Keyword>
\t\t\t<Keyword>Ortofotomapa</Keyword>
\t\t\t<Keyword>Raster</Keyword>
\t\t\t<Keyword>Rastry</Keyword>
\t\t\t<Keyword>Referential data</Keyword>
\t\t\t<Keyword>Sporządzanie ortoobrazów</Keyword>
\t\t\t<Keyword>Zdjęcie lotnicze</Keyword>
\t\t</KeywordList>
\t\t<OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution?"></OnlineResource>
\t\t<ContactInformation>
\t\t\t<ContactPersonPrimary>
\t\t\t\t<ContactPerson>Główny Geodeta Kraju</ContactPerson>
\t\t\t\t<ContactOrganization>Główny Urząd Geodezji i Kartografii</ContactOrganization>
\t\t\t</ContactPersonPrimary>
\t\t\t<ContactAddress>
\t\t\t\t<AddressType>postal</AddressType>
\t\t\t\t<Address>ul. Wspólna 2</Address>
\t\t\t\t<City>Warszawa</City>
\t\t\t\t<StateOrProvince>mazowieckie</StateOrProvince>
\t\t\t\t<PostCode>00-926</PostCode>
\t\t\t\t<Country>Polska</Country>
\t\t\t</ContactAddress>
\t\t\t<ContactVoiceTelephone>+48225631414</ContactVoiceTelephone>
\t\t\t<ContactElectronicMailAddress>gugik@gugik.gov.pl</ContactElectronicMailAddress>
\t\t</ContactInformation>
\t\t<Fees>Brak opłat</Fees>
\t\t<AccessConstraints>
Wykorzystanie usługi nie podlega żadnym ograniczeniom z wyłączeniem automatycznego pobierania i kolekcjonowania obrazów (tzw. harvesting). Nie podlega też ograniczeniom wytwarzanie i dalsze wykorzystywanie informacji, która wynika z bezpośredniego użycia usługi lub kompilacji prezentowanych przez nią treści z innymi danymi przestrzennymi.
\t\t</AccessConstraints>
\t\t<MaxWidth>4096</MaxWidth>
\t\t<MaxHeight>4096</MaxHeight>
\t</Service>
\t<Capability>
\t\t<Request>
\t\t\t<GetCapabilities>
\t\t\t\t<Format>application/vnd.ogc.wms_xml</Format>
\t\t\t\t<DCPType>
\t\t\t\t\t<HTTP><Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution?"></OnlineResource></Get></HTTP>
\t\t\t\t</DCPType>
\t\t\t</GetCapabilities>
\t\t\t<GetMap>
\t\t\t\t<Format>image/jpeg</Format>
\t\t\t\t<Format>image/png24</Format>
\t\t\t\t<Format>image/png8</Format>
\t\t\t\t<Format>image/png32</Format>
\t\t\t\t<Format>image/bmp</Format>
\t\t\t\t<Format>image/tiff</Format>
\t\t\t\t<Format>image/png</Format>
\t\t\t\t<Format>image/gif</Format>
\t\t\t\t<Format>image/svg+xml</Format>
\t\t\t\t<DCPType>
\t\t\t\t\t<HTTP><Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution?"></OnlineResource></Get></HTTP>
\t\t\t\t</DCPType>
\t\t\t</GetMap>
\t\t\t<GetStyles>
\t\t\t\t<Format>application/vnd.ogc.sld+xml</Format>
\t\t\t\t<DCPType>
\t\t\t\t\t<HTTP><Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution?"></OnlineResource></Get></HTTP>
\t\t\t\t</DCPType>
\t\t\t</GetStyles>
\t\t</Request>
\t\t<Exception>
\t\t\t<Format>application/vnd.ogc.se_xml</Format>
\t\t\t<Format>application/vnd.ogc.se_inimage</Format>
\t\t\t<Format>application/vnd.ogc.se_blank</Format>
\t\t</Exception>
\t\t<Layer>
\t\t\t<Title>Ortofotomapy dla Polski</Title>
\t\t\t<SRS>EPSG:4326</SRS>
\t\t\t<SRS>EPSG:2180</SRS>
\t\t\t<SRS>EPSG:2176</SRS>
\t\t\t<SRS>EPSG:2177</SRS>
\t\t\t<SRS>EPSG:2178</SRS>
\t\t\t<SRS>EPSG:2179</SRS>
\t\t\t<LatLonBoundingBox minx="14" miny="48.901811" maxx="24.759301" maxy="54.925806"></LatLonBoundingBox>
\t\t\t<BoundingBox SRS="EPSG:4326" minx="14" miny="48.901811" maxx="24.759301" maxy="54.925806"></BoundingBox>
\t\t\t<BoundingBox SRS="EPSG:2180" minx="165000" miny="125000" maxx="870000" maxy="800000"></BoundingBox>
\t\t\t<BoundingBox SRS="EPSG:2176" minx="5457982.49" miny="5418449.33" maxx="6125828.77" maxy="6132385.78"></BoundingBox>
\t\t\t<BoundingBox SRS="EPSG:2177" minx="6238075.72" miny="5424449.39" maxx="6934206.02" maxy="6109563.61"></BoundingBox>
\t\t\t<BoundingBox SRS="EPSG:2178" minx="7018267.57" miny="5439157.55" maxx="7742170.37" maxy="6095041.13"></BoundingBox>
\t\t\t<BoundingBox SRS="EPSG:2179" minx="7798647.46" miny="5462638.18" maxx="8549907.79" maxy="6088779.47"></BoundingBox>
\t\t\t<Layer queryable="1">
\t\t\t\t<Title>ORTOFOTOMAPA</Title>
\t\t\t\t<Abstract>ORTOFOTOMAPA</Abstract>
\t\t\t\t<SRS>EPSG:4326</SRS>
\t\t\t\t<SRS>EPSG:2180</SRS>
\t\t\t\t<SRS>EPSG:2176</SRS>
\t\t\t\t<SRS>EPSG:2177</SRS>
\t\t\t\t<SRS>EPSG:2178</SRS>
\t\t\t\t<SRS>EPSG:2179</SRS>
\t\t\t\t<SRS>EPSG:3857</SRS>
\t\t\t\t<LatLonBoundingBox minx="14" miny="48.901811" maxx="24.759301" maxy="54.925806"></LatLonBoundingBox>
\t\t\t\t<BoundingBox SRS="EPSG:4326" minx="14" miny="48.901811" maxx="24.759301" maxy="54.925806"></BoundingBox>
\t\t\t\t<BoundingBox SRS="EPSG:2180" minx="165000" miny="125000" maxx="870000" maxy="800000"></BoundingBox>
\t\t\t\t<BoundingBox SRS="EPSG:2176" minx="5457982.49" miny="5418449.33" maxx="6125828.77" maxy="6132385.78"></BoundingBox>
\t\t\t\t<BoundingBox SRS="EPSG:2177" minx="6238075.72" miny="5424449.39" maxx="6934206.02" maxy="6109563.61"></BoundingBox>
\t\t\t\t<BoundingBox SRS="EPSG:2178" minx="7018267.57" miny="5439157.55" maxx="7742170.37" maxy="6095041.13"></BoundingBox>
\t\t\t\t<BoundingBox SRS="EPSG:2179" minx="7798647.46" miny="5462638.18" maxx="8549907.79" maxy="6088779.47"></BoundingBox>
\t\t\t\t<BoundingBox SRS="EPSG:3857" minx="1572152.37" miny="6275208.65" maxx="2687896.25" maxy="7330061.09"></BoundingBox>
\t\t\t\t<Layer queryable="1">
\t\t\t\t\t<Name>Raster</Name>
\t\t\t\t\t<Title>Raster</Title>
\t\t\t\t\t<Abstract>Raster</Abstract>
\t\t\t\t\t<KeywordList>
\t\t\t\t\t\t<Keyword>Raster</Keyword>
\t\t\t\t\t</KeywordList>
\t\t\t\t\t<SRS>EPSG:4326</SRS>
\t\t\t\t\t<SRS>EPSG:2180</SRS>
\t\t\t\t\t<SRS>EPSG:2176</SRS>
\t\t\t\t\t<SRS>EPSG:2177</SRS>
\t\t\t\t\t<SRS>EPSG:2178</SRS>
\t\t\t\t\t<SRS>EPSG:2179</SRS>
\t\t\t\t\t<SRS>EPSG:3857</SRS>
\t\t\t\t\t<LatLonBoundingBox minx="14" miny="48.901811" maxx="24.759301" maxy="54.925806"></LatLonBoundingBox>
\t\t\t\t\t<BoundingBox SRS="EPSG:4326" minx="14" miny="48.901811" maxx="24.759301" maxy="54.925806"></BoundingBox>
\t\t\t\t\t<BoundingBox SRS="EPSG:2180" minx="165000" miny="125000" maxx="870000" maxy="800000"></BoundingBox>
\t\t\t\t\t<BoundingBox SRS="EPSG:2176" minx="5457982.49" miny="5418449.33" maxx="6125828.77" maxy="6132385.78"></BoundingBox>
\t\t\t\t\t<BoundingBox SRS="EPSG:2177" minx="6238075.72" miny="5424449.39" maxx="6934206.02" maxy="6109563.61"></BoundingBox>
\t\t\t\t\t<BoundingBox SRS="EPSG:2178" minx="7018267.57" miny="5439157.55" maxx="7742170.37" maxy="6095041.13"></BoundingBox>
\t\t\t\t\t<BoundingBox SRS="EPSG:2179" minx="7798647.46" miny="5462638.18" maxx="8549907.79" maxy="6088779.47"></BoundingBox>
\t\t\t\t\t<BoundingBox SRS="EPSG:3857" minx="1572152.37" miny="6275208.65" maxx="2687896.25" maxy="7330061.09"></BoundingBox>
\t\t\t\t\t<Style>
\t\t\t\t\t\t<Name>default</Name>
\t\t\t\t\t\t<Title>Raster</Title>
\t\t\t\t\t\t<LegendURL width="100" height="48">
\t\t\t\t\t\t\t<Format>image/png</Format>
\t\t\t\t\t\t\t<OnlineResource xlink:href="https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution?request=GetLegendGraphic%26version=1.1.1%26format=image/png%26layer=Raster" xlink:type="simple" xmlns:xlink="http://www.w3.org/1999/xlink"></OnlineResource>
\t\t\t\t\t\t</LegendURL>
\t\t\t\t\t</Style>
\t\t\t\t</Layer>
\t\t\t</Layer>
\t\t</Layer>
\t</Capability>
</WMT_MS_Capabilities>
`;

// Test XML string for WMTS Capabilities
const WMTS_Capabilities_1 = `
<?xml version="1.0" encoding="UTF-8"?>
<Capabilities xmlns="http://www.opengis.net/wmts/1.0"
xmlns:ows="http://www.opengis.net/ows/1.1"
xmlns:xlink="http://www.w3.org/1999/xlink"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xmlns:inspire_common="http://inspire.ec.europa.eu/schemas/common/1.0"
xmlns:inspire_vs="http://inspire.ec.europa.eu/schemas/inspire_vs_ows11/1.0"
version="1.0.0" 
xsi:schemaLocation="http://www.opengis.net/wmts/1.0
http://schemas.opengis.net/wmts/1.0/wmtsGetCapabilities_response.xsd
http://inspire.ec.europa.eu/schemas/inspire_vs_ows11/1.0
http://inspire.ec.europa.eu/schemas/inspire_vs_ows11/1.0/inspire_vs_ows_11.xsd">
\t<ows:ServiceIdentification>
\t\t<ows:Title>Usługa przeglądania ortofotomap dla obszaru Polski. Profil kafelkowany (WMTS)</ows:Title>
\t\t<ows:Abstract>Usługa przeglądania ortofotomap dla obszaru Polski. Dane udostępniane za pomocą tej usługi stanowią ortofotomapę wykonaną ze zdjęć lotniczych. Usługa wykorzystuje interfejs WMTS OGC w wersji 1.0.0.</ows:Abstract>
\t\t<ows:Keywords>
\t\t\t<ows:Keyword>WMTS</ows:Keyword>
\t\t\t<ows:Keyword>Tiled</ows:Keyword>
\t\t\t<ows:Keyword>Web Map Tile Service</ows:Keyword>
\t\t\t<ows:Keyword>Usługa przeglądania</ows:Keyword>
\t\t\t<ows:Keyword>Aerial ortoimagery</ows:Keyword>
\t\t\t<ows:Keyword>Aerial photography</ows:Keyword>
\t\t\t<ows:Keyword>Dane referencyjne</ows:Keyword>
\t\t\t<ows:Keyword>Fotografia terenu</ows:Keyword>
\t\t\t<ows:Keyword>Land image</ows:Keyword>
\t\t\t<ows:Keyword>Land photography</ows:Keyword>
\t\t\t<ows:Keyword>Obraz terenu</ows:Keyword>
\t\t\t<ows:Keyword>Orthoimagery</ows:Keyword>
\t\t\t<ows:Keyword>Ortofotogram</ows:Keyword>
\t\t\t<ows:Keyword>Ortofotomapa lotnicza</ows:Keyword>
\t\t\t<ows:Keyword>Ortofotomapa</ows:Keyword>
\t\t\t<ows:Keyword>Raster</ows:Keyword>
\t\t\t<ows:Keyword>Rastry</ows:Keyword>
\t\t\t<ows:Keyword>Referential data</ows:Keyword>
\t\t\t<ows:Keyword>Zdjęcie lotnicze</ows:Keyword>
\t\t\t<ows:Keyword>Sporządzanie ortoobrazów</ows:Keyword>
\t\t</ows:Keywords>
\t\t
\t\t<ows:ServiceType>OGC WMTS</ows:ServiceType>
\t\t<ows:ServiceTypeVersion>1.0.0</ows:ServiceTypeVersion>
\t\t<ows:Fees>Korzystanie z usługi danych przestrzennych oznacza akceptację bez ograniczeń i zastrzeżeń Regulaminu dostępnego na stronie internetowej Geoportalu http://www.geoportal.gov.pl/</ows:Fees>
\t\t<ows:AccessConstraints>brak ograniczeń</ows:AccessConstraints> 
\t</ows:ServiceIdentification>
\t<ows:ServiceProvider>
\t\t<ows:ProviderName>Główny Urząd Geodezji i Kartografii</ows:ProviderName>
\t\t<ows:ProviderSite xlink:type="simple" xlink:href="www.geoportal.gov.pl"/>
\t\t<ows:ServiceContact>
\t\t\t<ows:IndividualName>Dział Geoportalu</ows:IndividualName>
\t\t\t<ows:ContactInfo>
\t\t\t\t<ows:Phone>
\t\t\t\t\t<ows:Voice>+48225631414</ows:Voice>
\t\t\t\t</ows:Phone>
\t\t\t\t<ows:Address>
\t\t\t\t\t<ows:DeliveryPoint>Wspólna 2</ows:DeliveryPoint>
\t\t\t\t\t<ows:City>Warszawa</ows:City>
\t\t\t\t\t<ows:AdministrativeArea>mazowieckie</ows:AdministrativeArea>
\t\t\t\t\t<ows:PostalCode>00-926</ows:PostalCode>
\t\t\t\t\t<ows:Country>Polska</ows:Country>
\t\t\t\t\t<ows:ElectronicMailAddress>geoportal@geoportal.gov.pl</ows:ElectronicMailAddress>
\t\t\t\t</ows:Address>
\t\t\t</ows:ContactInfo>
\t\t</ows:ServiceContact>
\t</ows:ServiceProvider>
\t<ows:OperationsMetadata>
\t\t<ows:Operation name="GetCapabilities">
\t\t\t<ows:DCP>
\t\t\t\t<ows:HTTP>
\t\t\t\t\t<ows:Get xlink:href="https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMTS/StandardResolution?">
\t\t\t\t\t\t<ows:Constraint name="GetEncoding">
\t\t\t\t\t\t\t<ows:AllowedValues>
\t\t\t\t\t\t\t\t<ows:Value>KVP</ows:Value>
\t\t\t\t\t\t\t</ows:AllowedValues>
\t\t\t\t\t\t</ows:Constraint>
\t\t\t\t\t</ows:Get>
\t\t\t\t</ows:HTTP>
\t\t\t</ows:DCP>
\t\t</ows:Operation>
\t\t<ows:Operation name="GetTile">
\t\t\t<ows:DCP>
\t\t\t\t<ows:HTTP>
\t\t\t\t\t<ows:Get xlink:href="https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMTS/StandardResolution?">
\t\t\t\t\t\t<ows:Constraint name="GetEncoding">
\t\t\t\t\t\t\t<ows:AllowedValues>
\t\t\t\t\t\t\t\t<ows:Value>KVP</ows:Value>
\t\t\t\t\t\t\t</ows:AllowedValues>
\t\t\t\t\t\t</ows:Constraint>
\t\t\t\t\t</ows:Get>
\t\t\t\t</ows:HTTP>
\t\t\t</ows:DCP>
\t\t</ows:Operation>
\t\t<ows:Operation name="GetFeatureInfo">
\t\t\t<ows:DCP>
\t\t\t\t<ows:HTTP>
\t\t\t\t\t<ows:Get xlink:href="https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMTS/StandardResolution?">
\t\t\t\t\t\t<ows:Constraint name="GetEncoding">
\t\t\t\t\t\t\t<ows:AllowedValues>
\t\t\t\t\t\t\t\t<ows:Value>KVP</ows:Value>
\t\t\t\t\t\t\t</ows:AllowedValues>
\t\t\t\t\t\t</ows:Constraint>
\t\t\t\t\t</ows:Get>
\t\t\t\t</ows:HTTP>
\t\t\t</ows:DCP>
\t\t</ows:Operation>
\t\t<inspire_vs:ExtendedCapabilities>
\t\t\t<inspire_common:ResourceLocator>
\t\t\t\t<inspire_common:URL>https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMTS/StandardResolution?REQUEST=GetCapabilities&amp;SERVICE=WMTS</inspire_common:URL>
\t\t\t\t<inspire_common:MediaType>text/xml</inspire_common:MediaType>
\t\t\t</inspire_common:ResourceLocator>
\t\t\t<inspire_common:ResourceType>service</inspire_common:ResourceType>
\t\t\t<inspire_common:TemporalReference>
\t\t\t\t<inspire_common:DateOfPublication>2012-10-24</inspire_common:DateOfPublication>
\t\t\t</inspire_common:TemporalReference>
\t\t\t<inspire_common:Conformity>
\t\t\t\t<inspire_common:Specification xsi:type="inspire_common:citationInspireInteroperabilityRegulation_pol">
\t\t\t\t\t<inspire_common:Title>ROZPORZĄDZENIE KOMISJI (UE) NR 1089/2010 z dnia 23 listopada 2010 r. w sprawie wykonania dyrektywy 2007/2/WE Parlamentu Europejskiego i Rady w zakresie interoperacyjności zbiorów i usług danych przestrzennych</inspire_common:Title>
\t\t\t\t\t<inspire_common:DateOfPublication>2010-12-08</inspire_common:DateOfPublication>
\t\t\t\t\t<inspire_common:URI>OJ:L:2010:323:0011:0102:PL:PDF</inspire_common:URI>
\t\t\t\t\t<inspire_common:ResourceLocator>
\t\t\t\t\t\t<inspire_common:URL>http://eur-lex.europa.eu/LexUriServ/LexUriServ.do?uri=OJ:L:2010:323:0011:0102:PL:PDF</inspire_common:URL>
\t\t\t\t\t\t<inspire_common:MediaType>application/pdf</inspire_common:MediaType>
\t\t\t\t\t</inspire_common:ResourceLocator>
\t\t\t\t</inspire_common:Specification>
\t\t\t\t<inspire_common:Degree>notConformant</inspire_common:Degree>
\t\t\t</inspire_common:Conformity>
\t\t\t<inspire_common:MetadataPointOfContact>
\t\t\t\t<inspire_common:OrganisationName>Główny Urząd Geodezji i Kartografii</inspire_common:OrganisationName>
\t\t\t\t<inspire_common:EmailAddress>geoportal@geoportal.gov.pl</inspire_common:EmailAddress>
\t\t\t</inspire_common:MetadataPointOfContact>
\t\t\t<inspire_common:MetadataDate>2012-10-24</inspire_common:MetadataDate>
\t\t\t<inspire_common:SpatialDataServiceType>view</inspire_common:SpatialDataServiceType>
\t\t\t<inspire_common:MandatoryKeyword>
\t\t\t\t<inspire_common:KeywordValue>infoMapAccessService</inspire_common:KeywordValue>
\t\t\t</inspire_common:MandatoryKeyword>
\t\t\t<inspire_common:Keyword xsi:type="inspire_common:inspireTheme_pol">
\t\t\t\t<inspire_common:OriginatingControlledVocabulary>
\t\t\t\t\t<inspire_common:Title>GEMET - INSPIRE themes</inspire_common:Title>
\t\t\t\t\t<inspire_common:DateOfPublication>2008-06-01</inspire_common:DateOfPublication>
\t\t\t\t</inspire_common:OriginatingControlledVocabulary>
\t\t\t\t<inspire_common:KeywordValue>Użytkowanie terenu</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>WMTS</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Tiled</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>View service</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Web Map Tile Service</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Usługa przeglądania</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Aerial ortoimagery</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Aerial photography</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Dane referencyjne</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Fotografia terenu</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Land image</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Land photography</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Obraz terenu</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Orthoimagery</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Ortofotogram</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Ortofotomapa lotnicza</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Ortofotomapa</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Raster</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Rastry</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Referential data</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Zdjęcie lotnicze</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:Keyword>
\t\t\t\t<inspire_common:KeywordValue>Sporządzanie ortoobrazów</inspire_common:KeywordValue>
\t\t\t</inspire_common:Keyword>
\t\t\t<inspire_common:SupportedLanguages xmlns="http://inspire.ec.europa.eu/schemas/common/1.0">
\t\t\t\t<inspire_common:DefaultLanguage>
\t\t\t\t\t<inspire_common:Language>pol</inspire_common:Language>
\t\t\t\t</inspire_common:DefaultLanguage>
\t\t\t</inspire_common:SupportedLanguages>
\t\t\t<inspire_common:ResponseLanguage xmlns="http://inspire.ec.europa.eu/schemas/common/1.0">
\t\t\t\t<inspire_common:Language>pol</inspire_common:Language>
\t\t\t</inspire_common:ResponseLanguage>
\t\t\t<inspire_common:MetadataUrl>
\t\t\t\t<inspire_common:URL>https://mapy.geoportal.gov.pl/wss/service/CSWINSP/guest/CSWStartup?SERVICE=CSW&amp;REQUEST=GetRecordById&amp;VERSION=2.0.2&amp;ID=8b61894c-5e89-4626-8353-9f00b302d2eb&amp;OUTPUTFORMAT=application/xml&amp;OUTPUTSCHEMA=http://www.isotc211.org/2005/gmd&amp;ELEMENTSETNAME=full</inspire_common:URL>
\t\t\t\t<inspire_common:MediaType>text/xml</inspire_common:MediaType>
\t\t\t</inspire_common:MetadataUrl>
\t\t</inspire_vs:ExtendedCapabilities>
\t</ows:OperationsMetadata>
\t<Contents>
\t\t<Layer>
\t\t\t<ows:Title>ORTOFOTOMAPA</ows:Title>
\t\t\t<ows:Abstract>Warstwa prezentująca ortofotomapę utworzoną ze zdjęć lotniczych.</ows:Abstract>
\t\t\t<ows:Keywords>
\t\t\t\t<ows:Keyword>Ortofotomapa</ows:Keyword>
\t\t\t</ows:Keywords>
\t\t\t<ows:WGS84BoundingBox>
\t\t\t\t<ows:LowerCorner>13.800 48.800</ows:LowerCorner>
\t\t\t\t<ows:UpperCorner>24.400 55.000</ows:UpperCorner>
\t\t\t</ows:WGS84BoundingBox>
\t\t\t
\t\t\t<ows:Identifier>ORTOFOTOMAPA</ows:Identifier>
\t\t\t<ows:Metadata xlink:href="https://mapy.geoportal.gov.pl/wss/service/CSWINSP/guest/CSWStartup?SERVICE=CSW&amp;REQUEST=GetRecordById&amp;VERSION=2.0.2&amp;ID=3ff66d63-96f5-4b5d-88dd-bdbf5eb45b4a&amp;OUTPUTFORMAT=application/xml&amp;OUTPUTSCHEMA=http://www.isotc211.org/2005/gmd&amp;ELEMENTSETNAME=full"/>
\t\t\t<Style isDefault="true">
\t\t\t\t<ows:Title>Styl domyślny dla ortofotomapy</ows:Title>
\t\t\t\t<ows:Identifier>default</ows:Identifier>\t\t
\t\t\t\t<LegendURL format="image/png" xlink:href="https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMTS/StandardResolution/legenda.png" /> 
\t\t\t</Style>
\t\t\t<Format>image/jpeg</Format>
\t\t\t<InfoFormat>text/html</InfoFormat>
\t\t    <InfoFormat>text/xml; subtype=gml/3.2</InfoFormat>
\t\t    <InfoFormat>application/gml+xml; version=3.2</InfoFormat>
\t\t    
\t\t    
 <TileMatrixSetLink>
<TileMatrixSet>EPSG:2180</TileMatrixSet>
<TileMatrixSetLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:0</TileMatrix>
<MinTileRow>0</MinTileRow>
<MaxTileRow>0</MaxTileRow>
<MinTileCol>0</MinTileCol>
<MaxTileCol>0</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:1</TileMatrix>
<MinTileRow>0</MinTileRow>
<MaxTileRow>0</MaxTileRow>
<MinTileCol>0</MinTileCol>
<MaxTileCol>0</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:2</TileMatrix>
<MinTileRow>0</MinTileRow>
<MaxTileRow>0</MaxTileRow>
<MinTileCol>0</MinTileCol>
<MaxTileCol>0</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:3</TileMatrix>
<MinTileRow>0</MinTileRow>
<MaxTileRow>1</MaxTileRow>
<MinTileCol>0</MinTileCol>
<MaxTileCol>1</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:4</TileMatrix>
<MinTileRow>0</MinTileRow>
<MaxTileRow>2</MaxTileRow>
<MinTileCol>0</MinTileCol>
<MaxTileCol>2</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:5</TileMatrix>
<MinTileRow>0</MinTileRow>
<MaxTileRow>5</MaxTileRow>
<MinTileCol>0</MinTileCol>
<MaxTileCol>5</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:6</TileMatrix>
<MinTileRow>1</MinTileRow>
<MaxTileRow>10</MaxTileRow>
<MinTileCol>0</MinTileCol>
<MaxTileCol>11</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:7</TileMatrix>
<MinTileRow>2</MinTileRow>
<MaxTileRow>21</MaxTileRow>
<MinTileCol>1</MinTileCol>
<MaxTileCol>22</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:8</TileMatrix>
<MinTileRow>5</MinTileRow>
<MaxTileRow>53</MaxTileRow>
<MinTileCol>4</MinTileCol>
<MaxTileCol>56</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:9</TileMatrix>
<MinTileRow>10</MinTileRow>
<MaxTileRow>106</MaxTileRow>
<MinTileCol>9</MinTileCol>
<MaxTileCol>113</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:10</TileMatrix>
<MinTileRow>20</MinTileRow>
<MaxTileRow>213</MaxTileRow>
<MinTileCol>19</MinTileCol>
<MaxTileCol>226</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:11</TileMatrix>
<MinTileRow>51</MinTileRow>
<MaxTileRow>532</MaxTileRow>
<MinTileCol>49</MinTileCol>
<MaxTileCol>566</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:12</TileMatrix>
<MinTileRow>103</MinTileRow>
<MaxTileRow>1065</MaxTileRow>
<MinTileCol>98</MinTileCol>
<MaxTileCol>1132</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:13</TileMatrix>
<MinTileRow>258</MinTileRow>
<MaxTileRow>2663</MaxTileRow>
<MinTileCol>246</MinTileCol>
<MaxTileCol>2830</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:14</TileMatrix>
<MinTileRow>516</MinTileRow>
<MaxTileRow>5327</MaxTileRow>
<MinTileCol>492</MinTileCol>
<MaxTileCol>5661</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:15</TileMatrix>
<MinTileRow>1033</MinTileRow>
<MaxTileRow>10655</MaxTileRow>
<MinTileCol>984</MinTileCol>
<MaxTileCol>11322</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:2180:16</TileMatrix>
<MinTileRow>2066</MinTileRow>
<MaxTileRow>21311</MaxTileRow>
<MinTileCol>1969</MinTileCol>
<MaxTileCol>22644</MaxTileCol>
</TileMatrixLimits>
</TileMatrixSetLimits>
</TileMatrixSetLink>
<TileMatrixSetLink>
<TileMatrixSet>EPSG:4326</TileMatrixSet>
<TileMatrixSetLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:0</TileMatrix>
<MinTileRow>0</MinTileRow>
<MaxTileRow>0</MaxTileRow>
<MinTileCol>0</MinTileCol>
<MaxTileCol>0</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:1</TileMatrix>
<MinTileRow>0</MinTileRow>
<MaxTileRow>0</MaxTileRow>
<MinTileCol>0</MinTileCol>
<MaxTileCol>0</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:2</TileMatrix>
<MinTileRow>0</MinTileRow>
<MaxTileRow>0</MaxTileRow>
<MinTileCol>0</MinTileCol>
<MaxTileCol>1</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:3</TileMatrix>
<MinTileRow>0</MinTileRow>
<MaxTileRow>1</MaxTileRow>
<MinTileCol>0</MinTileCol>
<MaxTileCol>2</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:4</TileMatrix>
<MinTileRow>0</MinTileRow>
<MaxTileRow>2</MaxTileRow>
<MinTileCol>0</MinTileCol>
<MaxTileCol>5</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:5</TileMatrix>
<MinTileRow>0</MinTileRow>
<MaxTileRow>5</MaxTileRow>
<MinTileCol>1</MinTileCol>
<MaxTileCol>10</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:6</TileMatrix>
<MinTileRow>1</MinTileRow>
<MaxTileRow>11</MaxTileRow>
<MinTileCol>2</MinTileCol>
<MaxTileCol>20</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:7</TileMatrix>
<MinTileRow>3</MinTileRow>
<MaxTileRow>23</MaxTileRow>
<MinTileCol>5</MinTileCol>
<MaxTileCol>41</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:8</TileMatrix>
<MinTileRow>9</MinTileRow>
<MaxTileRow>58</MaxTileRow>
<MinTileCol>14</MinTileCol>
<MaxTileCol>104</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:9</TileMatrix>
<MinTileRow>18</MinTileRow>
<MaxTileRow>116</MaxTileRow>
<MinTileCol>29</MinTileCol>
<MaxTileCol>208</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:10</TileMatrix>
<MinTileRow>36</MinTileRow>
<MaxTileRow>232</MaxTileRow>
<MinTileCol>59</MinTileCol>
<MaxTileCol>417</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:11</TileMatrix>
<MinTileRow>91</MinTileRow>
<MaxTileRow>581</MaxTileRow>
<MinTileCol>148</MinTileCol>
<MaxTileCol>1042</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:12</TileMatrix>
<MinTileRow>183</MinTileRow>
<MaxTileRow>1163</MaxTileRow>
<MinTileCol>297</MinTileCol>
<MaxTileCol>2085</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:13</TileMatrix>
<MinTileRow>458</MinTileRow>
<MaxTileRow>2908</MaxTileRow>
<MinTileCol>744</MinTileCol>
<MaxTileCol>5214</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:14</TileMatrix>
<MinTileRow>916</MinTileRow>
<MaxTileRow>5817</MaxTileRow>
<MinTileCol>1489</MinTileCol>
<MaxTileCol>10428</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:15</TileMatrix>
<MinTileRow>1832</MinTileRow>
<MaxTileRow>11634</MaxTileRow>
<MinTileCol>2979</MinTileCol>
<MaxTileCol>20857</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:4326:16</TileMatrix>
<MinTileRow>3665</MinTileRow>
<MaxTileRow>23269</MaxTileRow>
<MinTileCol>5959</MinTileCol>
<MaxTileCol>41714</MaxTileCol>
</TileMatrixLimits>
</TileMatrixSetLimits>
</TileMatrixSetLink>
<TileMatrixSetLink>
<TileMatrixSet>EPSG:3857</TileMatrixSet>
<TileMatrixSetLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:0</TileMatrix>
<MinTileRow>0</MinTileRow>
<MaxTileRow>0</MaxTileRow>
<MinTileCol>0</MinTileCol>
<MaxTileCol>0</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:1</TileMatrix>
<MinTileRow>0</MinTileRow>
<MaxTileRow>0</MaxTileRow>
<MinTileCol>1</MinTileCol>
<MaxTileCol>1</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:2</TileMatrix>
<MinTileRow>1</MinTileRow>
<MaxTileRow>1</MaxTileRow>
<MinTileCol>2</MinTileCol>
<MaxTileCol>2</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:3</TileMatrix>
<MinTileRow>2</MinTileRow>
<MaxTileRow>2</MaxTileRow>
<MinTileCol>4</MinTileCol>
<MaxTileCol>4</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:4</TileMatrix>
<MinTileRow>5</MinTileRow>
<MaxTileRow>5</MaxTileRow>
<MinTileCol>8</MinTileCol>
<MaxTileCol>9</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:5</TileMatrix>
<MinTileRow>10</MinTileRow>
<MaxTileRow>11</MaxTileRow>
<MinTileCol>17</MinTileCol>
<MaxTileCol>18</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:6</TileMatrix>
<MinTileRow>20</MinTileRow>
<MaxTileRow>22</MaxTileRow>
<MinTileCol>34</MinTileCol>
<MaxTileCol>36</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:7</TileMatrix>
<MinTileRow>40</MinTileRow>
<MaxTileRow>44</MaxTileRow>
<MinTileCol>68</MinTileCol>
<MaxTileCol>72</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:8</TileMatrix>
<MinTileRow>81</MinTileRow>
<MaxTileRow>88</MaxTileRow>
<MinTileCol>137</MinTileCol>
<MaxTileCol>145</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:9</TileMatrix>
<MinTileRow>162</MinTileRow>
<MaxTileRow>176</MaxTileRow>
<MinTileCol>275</MinTileCol>
<MaxTileCol>291</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:10</TileMatrix>
<MinTileRow>324</MinTileRow>
<MaxTileRow>352</MaxTileRow>
<MinTileCol>551</MinTileCol>
<MaxTileCol>582</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:11</TileMatrix>
<MinTileRow>648</MinTileRow>
<MaxTileRow>704</MaxTileRow>
<MinTileCol>1102</MinTileCol>
<MaxTileCol>1164</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:12</TileMatrix>
<MinTileRow>1297</MinTileRow>
<MaxTileRow>1408</MaxTileRow>
<MinTileCol>2205</MinTileCol>
<MaxTileCol>2329</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:13</TileMatrix>
<MinTileRow>2595</MinTileRow>
<MaxTileRow>2816</MaxTileRow>
<MinTileCol>4410</MinTileCol>
<MaxTileCol>4658</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:14</TileMatrix>
<MinTileRow>5191</MinTileRow>
<MaxTileRow>5632</MaxTileRow>
<MinTileCol>8820</MinTileCol>
<MaxTileCol>9316</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:15</TileMatrix>
<MinTileRow>10382</MinTileRow>
<MaxTileRow>11265</MaxTileRow>
<MinTileCol>17641</MinTileCol>
<MaxTileCol>18632</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:16</TileMatrix>
<MinTileRow>20765</MinTileRow>
<MaxTileRow>22530</MaxTileRow>
<MinTileCol>35282</MinTileCol>
<MaxTileCol>37265</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:17</TileMatrix>
<MinTileRow>41531</MinTileRow>
<MaxTileRow>45061</MaxTileRow>
<MinTileCol>70565</MinTileCol>
<MaxTileCol>74530</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:18</TileMatrix>
<MinTileRow>83063</MinTileRow>
<MaxTileRow>90122</MaxTileRow>
<MinTileCol>141131</MinTileCol>
<MaxTileCol>149061</MaxTileCol>
</TileMatrixLimits>
<TileMatrixLimits>
<TileMatrix>EPSG:3857:19</TileMatrix>
<MinTileRow>166126</MinTileRow>
<MaxTileRow>180245</MaxTileRow>
<MinTileCol>282263</MinTileCol>
<MaxTileCol>298123</MaxTileCol>
</TileMatrixLimits>
</TileMatrixSetLimits>
</TileMatrixSetLink>
</Layer>
<TileMatrixSet>
<ows:Identifier>EPSG:2180</ows:Identifier>
<ows:SupportedCRS>urn:ogc:def:crs:EPSG::2180</ows:SupportedCRS>
<TileMatrix>
<ows:Identifier>EPSG:2180:0</ows:Identifier>
<ScaleDenominator>3.0238155714285716E7</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>1</MatrixWidth>
<MatrixHeight>1</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:2180:1</ows:Identifier>
<ScaleDenominator>1.5119077857142858E7</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>1</MatrixWidth>
<MatrixHeight>1</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:2180:2</ows:Identifier>
<ScaleDenominator>7559538.928571429</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>1</MatrixWidth>
<MatrixHeight>1</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:2180:3</ows:Identifier>
<ScaleDenominator>3779769.4642857146</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>2</MatrixWidth>
<MatrixHeight>2</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:2180:4</ows:Identifier>
<ScaleDenominator>1889884.7321428573</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>3</MatrixWidth>
<MatrixHeight>3</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:2180:5</ows:Identifier>
<ScaleDenominator>944942.3660714286</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>6</MatrixWidth>
<MatrixHeight>6</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:2180:6</ows:Identifier>
<ScaleDenominator>472471.1830357143</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>12</MatrixWidth>
<MatrixHeight>11</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:2180:7</ows:Identifier>
<ScaleDenominator>236235.59151785716</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>23</MatrixWidth>
<MatrixHeight>22</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:2180:8</ows:Identifier>
<ScaleDenominator>94494.23660714286</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>57</MatrixWidth>
<MatrixHeight>54</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:2180:9</ows:Identifier>
<ScaleDenominator>47247.11830357143</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>114</MatrixWidth>
<MatrixHeight>107</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:2180:10</ows:Identifier>
<ScaleDenominator>23623.559151785714</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>227</MatrixWidth>
<MatrixHeight>214</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:2180:11</ows:Identifier>
<ScaleDenominator>9449.423660714287</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>567</MatrixWidth>
<MatrixHeight>533</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:2180:12</ows:Identifier>
<ScaleDenominator>4724.711830357143</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>1133</MatrixWidth>
<MatrixHeight>1066</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:2180:13</ows:Identifier>
<ScaleDenominator>1889.8847321428573</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>2831</MatrixWidth>
<MatrixHeight>2664</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:2180:14</ows:Identifier>
<ScaleDenominator>944.9423660714286</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>5662</MatrixWidth>
<MatrixHeight>5328</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:2180:15</ows:Identifier>
<ScaleDenominator>472.4711830357143</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>11323</MatrixWidth>
<MatrixHeight>10656</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:2180:16</ows:Identifier>
<ScaleDenominator>236.23559151785716</ScaleDenominator>
<TopLeftCorner>850000.0 100000.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>22645</MatrixWidth>
<MatrixHeight>21312</MatrixHeight>
</TileMatrix>
</TileMatrixSet>
<TileMatrixSet>
<ows:Identifier>EPSG:4326</ows:Identifier>
<ows:SupportedCRS>urn:ogc:def:crs:EPSG::4326</ows:SupportedCRS>
<TileMatrix>
<ows:Identifier>EPSG:4326:0</ows:Identifier>
<ScaleDenominator>3.0238155714402866E7</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>1</MatrixWidth>
<MatrixHeight>1</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:4326:1</ows:Identifier>
<ScaleDenominator>1.5119077857201433E7</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>1</MatrixWidth>
<MatrixHeight>1</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:4326:2</ows:Identifier>
<ScaleDenominator>7559538.928600716</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>2</MatrixWidth>
<MatrixHeight>1</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:4326:3</ows:Identifier>
<ScaleDenominator>3779769.464300358</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>3</MatrixWidth>
<MatrixHeight>2</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:4326:4</ows:Identifier>
<ScaleDenominator>1889884.732150179</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>6</MatrixWidth>
<MatrixHeight>3</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:4326:5</ows:Identifier>
<ScaleDenominator>944942.3660750896</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>11</MatrixWidth>
<MatrixHeight>6</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:4326:6</ows:Identifier>
<ScaleDenominator>472471.1830375448</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>21</MatrixWidth>
<MatrixHeight>12</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:4326:7</ows:Identifier>
<ScaleDenominator>236235.5915187724</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>42</MatrixWidth>
<MatrixHeight>24</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:4326:8</ows:Identifier>
<ScaleDenominator>94494.23660750895</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>105</MatrixWidth>
<MatrixHeight>59</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:4326:9</ows:Identifier>
<ScaleDenominator>47247.118303754476</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>209</MatrixWidth>
<MatrixHeight>117</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:4326:10</ows:Identifier>
<ScaleDenominator>23623.559151877238</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>418</MatrixWidth>
<MatrixHeight>233</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:4326:11</ows:Identifier>
<ScaleDenominator>9449.423660750896</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>1043</MatrixWidth>
<MatrixHeight>582</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:4326:12</ows:Identifier>
<ScaleDenominator>4724.711830375448</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>2086</MatrixWidth>
<MatrixHeight>1164</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:4326:13</ows:Identifier>
<ScaleDenominator>1889.884732150179</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>5215</MatrixWidth>
<MatrixHeight>2909</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:4326:14</ows:Identifier>
<ScaleDenominator>944.9423660750895</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>10429</MatrixWidth>
<MatrixHeight>5818</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:4326:15</ows:Identifier>
<ScaleDenominator>472.47118303754473</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>20858</MatrixWidth>
<MatrixHeight>11635</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:4326:16</ows:Identifier>
<ScaleDenominator>236.23559151877237</ScaleDenominator>
<TopLeftCorner>56.0 12.0</TopLeftCorner>
<TileWidth>512</TileWidth>
<TileHeight>512</TileHeight>
<MatrixWidth>41715</MatrixWidth>
<MatrixHeight>23270</MatrixHeight>
</TileMatrix>
</TileMatrixSet>
<TileMatrixSet>
<ows:Identifier>EPSG:3857</ows:Identifier>
<ows:SupportedCRS>urn:ogc:def:crs:EPSG::3857</ows:SupportedCRS>
<TileMatrix>
<ows:Identifier>EPSG:3857:0</ows:Identifier>
<ScaleDenominator>5.590822640263356E8</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>1</MatrixWidth>
<MatrixHeight>1</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:1</ows:Identifier>
<ScaleDenominator>2.795411320131673E8</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>2</MatrixWidth>
<MatrixHeight>1</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:2</ows:Identifier>
<ScaleDenominator>1.397705660065841E8</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>3</MatrixWidth>
<MatrixHeight>2</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:3</ows:Identifier>
<ScaleDenominator>6.988528300329159E7</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>5</MatrixWidth>
<MatrixHeight>3</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:4</ows:Identifier>
<ScaleDenominator>3.4942641501645796E7</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>10</MatrixWidth>
<MatrixHeight>6</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:5</ows:Identifier>
<ScaleDenominator>1.7471320750822898E7</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>19</MatrixWidth>
<MatrixHeight>12</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:6</ows:Identifier>
<ScaleDenominator>8735660.375411449</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>37</MatrixWidth>
<MatrixHeight>23</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:7</ows:Identifier>
<ScaleDenominator>4367830.1877057245</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>73</MatrixWidth>
<MatrixHeight>45</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:8</ows:Identifier>
<ScaleDenominator>2183915.093853335</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>146</MatrixWidth>
<MatrixHeight>89</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:9</ows:Identifier>
<ScaleDenominator>1091957.5469261948</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>292</MatrixWidth>
<MatrixHeight>177</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:10</ows:Identifier>
<ScaleDenominator>545978.7734635699</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>583</MatrixWidth>
<MatrixHeight>353</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:11</ows:Identifier>
<ScaleDenominator>272989.38673131244</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>1165</MatrixWidth>
<MatrixHeight>705</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:12</ows:Identifier>
<ScaleDenominator>136494.69336565622</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>2330</MatrixWidth>
<MatrixHeight>1409</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:13</ows:Identifier>
<ScaleDenominator>68247.34668282811</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>4659</MatrixWidth>
<MatrixHeight>2817</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:14</ows:Identifier>
<ScaleDenominator>34123.673341414054</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>9317</MatrixWidth>
<MatrixHeight>5633</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:15</ows:Identifier>
<ScaleDenominator>17061.8366711795</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>18633</MatrixWidth>
<MatrixHeight>11266</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:16</ows:Identifier>
<ScaleDenominator>8530.91833558975</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>37266</MatrixWidth>
<MatrixHeight>22531</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:17</ows:Identifier>
<ScaleDenominator>4265.459167322403</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>74531</MatrixWidth>
<MatrixHeight>45062</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:18</ows:Identifier>
<ScaleDenominator>2132.729584133673</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>149062</MatrixWidth>
<MatrixHeight>90123</MatrixHeight>
</TileMatrix>
<TileMatrix>
<ows:Identifier>EPSG:3857:19</ows:Identifier>
<ScaleDenominator>1066.3647915943654</ScaleDenominator>
<TopLeftCorner>-2.0037508342787E7 2.0037508342787E7</TopLeftCorner>
<TileWidth>256</TileWidth>
<TileHeight>256</TileHeight>
<MatrixWidth>298124</MatrixWidth>
<MatrixHeight>180246</MatrixHeight>
</TileMatrix>
</TileMatrixSet>

\t</Contents>
</Capabilities>
`;

describe('maps tests', () => {
  test('detectMapServiceType', () => {
    expect(detectMapServiceType('http://example.com/{x}/{y}/{z}')).toBe('XYZ');
    expect(
      detectMapServiceType('https://tile.openstreetmap.org/{z}/{x}/{y}.png#type=background'),
    ).toBe('XYZ');
    expect(detectMapServiceType('https://tile.openstreetmap.org/{z}/{x}/{y}.png')).toBe('XYZ');

    expect(
      detectMapServiceType(
        'https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMTS/StandardResolution#type=background&layer=ORTOFOTOMAPA&label=Orotofotomapa',
      ),
    ).toBe('WMTS');
    expect(
      detectMapServiceType(
        'https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMTS/StandardResolution',
      ),
    ).toBe('WMTS');
    expect(detectMapServiceType('https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMTS')).toBe(
      'WMTS',
    );

    expect(
      detectMapServiceType(
        'https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/HighResolution#type=background&service=wms',
      ),
    ).toBe('WMS');
    expect(
      detectMapServiceType(
        'https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/HighResolution',
      ),
    ).toBe('WMS');
    expect(detectMapServiceType('https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS')).toBe(
      'WMS',
    );

    expect(
      detectMapServiceType(
        'https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMSK/HighResolution',
      ),
    ).toBeUndefined();
    expect(detectMapServiceType('https://tile.openstreetmap.org/{Z}/{x}/{y}.png')).toBeUndefined();
    expect(detectMapServiceType('https://tile.openstreetmap.org/{a}/{x}/{y}.png')).toBeUndefined();
    expect(detectMapServiceType('https://tile.openstreetmap.org/{x}/{y}.png')).toBeUndefined();
    expect(
      detectMapServiceType(
        'https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/AWMTS/StandardResolution',
      ),
    ).toBeUndefined();
  });

  test('parseMapSourceURL', () => {
    expect(parseMapSourceURL('http://example.com/{x}/{y}/{z}')).toStrictEqual({
      url: 'http://example.com/{x}/{y}/{z}',
      service: 'XYZ',
      kind: undefined,
      label: undefined,
      group: undefined,
      format: undefined,
    });
    expect(parseMapSourceURL('http://example.com/{x}/{y}/{z}#service=WMS')).toStrictEqual({
      url: 'http://example.com/{x}/{y}/{z}',
      service: 'WMS',
      kind: undefined,
      label: undefined,
      group: undefined,
      format: undefined,
    });
    expect(parseMapSourceURL('http://example.com/{x}/{y}/{z}#type=background')).toStrictEqual({
      url: 'http://example.com/{x}/{y}/{z}',
      service: 'XYZ',
      kind: 'background',
      label: undefined,
      group: undefined,
      format: undefined,
    });
    expect(parseMapSourceURL('https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS#label=Custom%20label')).toStrictEqual({
      url: 'https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS',
      service: 'WMS',
      kind: undefined,
      label: 'Custom label',
      group: undefined,
      format: undefined,
    });
    expect(parseMapSourceURL('https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS#label=Custom%20label&format=image%2fpng')).toStrictEqual({
      url: 'https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS',
      service: 'WMS',
      kind: undefined,
      label: 'Custom label',
      group: undefined,
      format: 'image/png',
    });
    expect(parseMapSourceURL('https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS#group=xyz&format=image%2fjpeg')).toStrictEqual({
      url: 'https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS',
      service: 'WMS',
      kind: undefined,
      label: undefined,
      group: 'xyz',
      format: 'image/jpeg',
    });
  });

  test('parseXML', () => {
    // /** @type {XMLDocument} */
    // const doc=new DOMParser().parseFromString(WMS_CAPABILITIES_1, 'application/xml');
    // // console.log(WMS_CAPABILITIES_1)
    // // console.log(doc.body.innerHTML);
    // const layers = doc.querySelectorAll("Layer")
    // for(let i=0; i<layers.length; i++){
    //     const layer=layers.item(i);
    //     layer.getElementsByTagName()
    //     console.log("Title: ", layer.querySelector("> Title")?.textContent);
    //     console.log("Name: ", layer.querySelector("> Name")?.textContent);
    //     console.log("Parent: ", layer.parentElement?.nodeName);
    // }
    // const layers = doc?.getElementsByTagName("Layer");
    // for(let i=0; i<layers.length; i++){
    //     const layer=layers.item(i);
    //
    //     console.log("Parent: ", layer.parentElement.nodeName);
    // }
  });
});
