import React, { useEffect, useRef, useState } from 'react';

export function useComponentWidth() {
  const ref = useRef();
  const [width, setWidth] = useState();
  const handleResize = () => {
    if (ref && ref.current && ref.current.offsetWidth !== width) {
      setWidth(ref.current.offsetWidth);
    }
  };
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return (_) => window.removeEventListener('resize', handleResize);
  });
  useEffect(() => {
    handleResize();
  }, [ref, ref.current]);
  return { ref, width };
}

export function useComponentHeight() {
  const ref = useRef();
  const [height, setHeight] = useState();
  const handleResize = () => {
    if (ref && ref.current && ref.current.offsetHeight !== height) {
      setHeight(ref.current.offsetHeight);
    }
  };
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return (_) => window.removeEventListener('resize', handleResize);
  });
  useEffect(() => {
    handleResize();
  }, [ref, ref.current]);
  return { ref, height };
}
