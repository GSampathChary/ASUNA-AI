import React, { useEffect, useRef } from 'react';
import { AsunaCoreEngine } from './AsunaCore';

export const AsunaCoreWeb = ({ currentState, symbolType = 'diamond' }) => {
  const mountRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    if (!engineRef.current) {
      engineRef.current = new AsunaCoreEngine(mountRef.current, symbolType);
    } else {
      engineRef.current.setSymbolType(symbolType);
    }

    return () => {
      if (engineRef.current && mountRef.current) {
        mountRef.current.innerHTML = '';
        engineRef.current = null;
      }
    };
  }, [symbolType]);

  useEffect(() => {
    if (engineRef.current && currentState) {
      engineRef.current.setState(currentState);
    }
  }, [currentState]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    />
  );
};
