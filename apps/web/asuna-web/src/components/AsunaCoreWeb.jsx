import React, { useEffect, useRef } from 'react';
import { AsunaCoreEngine } from './AsunaCore';

export const AsunaCoreWeb = ({ currentState, cameraPose, symbolType = 'humanoid', onClick, onWheel }) => {
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

  useEffect(() => {
    if (engineRef.current && cameraPose) {
      engineRef.current.setCameraPose(cameraPose);
    }
  }, [cameraPose]);

  return (
    <div
      ref={mountRef}
      onClick={onClick}
      onWheel={onWheel}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: 'pointer'
      }}
    />
  );
};
