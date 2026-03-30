
import React, { useState } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackIcon?: string;
}

const SafeImage: React.FC<SafeImageProps> = ({ fallbackIcon = 'restaurant', className = '', ...props }) => {
  const [error, setError] = useState(false);

  if (error || !props.src) {
    return (
      <div className={`${className} flex items-center justify-center bg-white/5`}>
        <span className="material-symbols-outlined text-slate-500 opacity-50">{fallbackIcon}</span>
      </div>
    );
  }

  return <img {...props} className={className} onError={() => setError(true)} />;
};

export default SafeImage;
