import React, { useEffect, useState } from 'react';
import characterImg from '../assets/character.png'; // ensure the image exists in assets folder

export default function AnimeCharacter() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const style = {
    position: 'fixed',
    left: position.x + 10, // offset a bit
    top: position.y + 10,
    pointerEvents: 'none',
    width: '80px',
    height: '80px',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
  };

  return <img src={characterImg} alt="Anime Character" style={style} />;
}
