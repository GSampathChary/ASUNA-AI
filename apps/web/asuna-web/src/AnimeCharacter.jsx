import React, { useEffect, useState } from 'react';
import './AnimeCharacter.css';
import characterImage from './assets/character.png';

const AnimeCharacter = () => {
  const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const style = {
    left: position.x - 60, // offset to center image (assuming 120px width)
    top: position.y - 120, // place above cursor
  };

  return (
    <img
      src={characterImage}
      alt="Luffy character"
      className="anime-character"
      style={style}
    />
  );
};

export default AnimeCharacter;
