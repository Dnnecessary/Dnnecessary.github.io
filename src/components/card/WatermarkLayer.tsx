import React from 'react';

interface WatermarkLayerProps {
  imageUrl: string;
  opacity: number;
  position: string;
  scale: number;
}

const WatermarkLayer: React.FC<WatermarkLayerProps> = ({ imageUrl, opacity, position, scale }) => {
  const positionStyles: Record<string, React.CSSProperties> = {
    center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    tile: { top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `url(${imageUrl})`, backgroundRepeat: 'repeat', backgroundSize: `${scale * 120}px` },
  };

  if (position === 'tile') {
    return (
      <div
        style={{
          position: 'absolute',
          ...positionStyles.tile,
          opacity,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
    );
  }

  return (
    <img
      src={imageUrl}
      alt="水印"
      style={{
        position: 'absolute',
        ...positionStyles[position],
        opacity,
        pointerEvents: 'none',
        zIndex: 10,
        width: `${scale * 100}%`,
        maxWidth: '200px',
      }}
    />
  );
};

export default WatermarkLayer;
