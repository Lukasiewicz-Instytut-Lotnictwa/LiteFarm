import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';

export default function useLayerManager() {
  const [map, setMap] = useState(null);
  const [maps, setMaps] = useState(null);
  const [layers, setLayers] = useState([]);

  return useMemo(
    () => ({
      initLayerManager: (map, maps) => {
        setMap(map);
        setMaps(maps);
      },
    }),
    [setMap, setMaps],
  );
}
