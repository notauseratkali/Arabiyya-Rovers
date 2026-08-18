import React, { useState, useEffect } from 'react';
import { getCachedBrandAssets, subscribeToBrandAssets, BrandAssets } from '../services/brandService';

export interface RoverLogoProps {
  variant?: 'color' | 'white' | 'black';
  className?: string;
  size?: number | string;
  alt?: string;
  forceSvg?: boolean;
}

export const RoverLogo: React.FC<RoverLogoProps> = ({
  variant = 'color',
  className = 'w-8 h-8',
  size,
  alt = 'Arabiyya Rovers (ASG ROVERS) Logo',
  forceSvg = false
}) => {
  const [assets, setAssets] = useState<BrandAssets>(() => getCachedBrandAssets());

  useEffect(() => {
    const unsub = subscribeToBrandAssets((newAssets) => {
      setAssets(newAssets);
    });
    return unsub;
  }, []);

  const customPng = !forceSvg
    ? variant === 'color'
      ? assets.colorLogoPng
      : variant === 'white'
      ? assets.whiteLogoPng
      : assets.blackLogoPng
    : null;

  const style = size ? { width: size, height: size } : undefined;

  // If a custom PNG logo has been uploaded by the Administrator, render the PNG
  if (customPng) {
    return (
      <img
        src={customPng}
        alt={alt}
        className={`inline-block object-contain select-none shrink-0 ${className}`}
        style={style}
      />
    );
  }

  let centerFill = '#0077c8';
  let wingFill = '#9ed2eb';
  let starFill = '#750c18';
  let bannerFill = '#6c0c17';
  let bannerText = '#ffffff';
  let strokeColor = '#ffffff';
  let bottomCenterFill = '#0077c8';
  let bottomWingFill = '#9ed2eb';

  if (variant === 'white') {
    centerFill = '#ffffff';
    wingFill = '#ffffff';
    starFill = '#000000';
    bannerFill = '#ffffff';
    bannerText = '#000000';
    strokeColor = '#000000';
    bottomCenterFill = '#ffffff';
    bottomWingFill = '#ffffff';
  } else if (variant === 'black') {
    centerFill = '#000000';
    wingFill = '#000000';
    starFill = '#ffffff';
    bannerFill = '#000000';
    bannerText = '#ffffff';
    strokeColor = '#ffffff';
    bottomCenterFill = '#000000';
    bottomWingFill = '#000000';
  }

  const strokeW = 6;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 560"
      className={`inline-block select-none shrink-0 ${className}`}
      style={style}
      aria-label={alt}
      role="img"
    >
      {/* Center Main Petal */}
      <g id="center-petal">
        <path
          d="M 250 12 C 275 60 350 145 350 240 C 350 295 315 340 300 375 L 200 375 C 185 340 150 295 150 240 C 150 145 225 60 250 12 Z"
          fill={centerFill}
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />
        {/* Center Spine Slit */}
        <path
          d="M 250 50 L 250 375"
          stroke={strokeColor}
          strokeWidth={5}
          strokeLinecap="round"
        />
      </g>

      {/* Left Wing Petal */}
      <g id="left-wing">
        <path
          d="M 195 240 C 180 205 130 200 65 210 C 15 218 -2 245 2 280 C 10 330 35 390 55 425 C 45 375 80 340 140 340 C 170 340 188 358 195 375 Z"
          fill={wingFill}
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />
        {/* Left Star */}
        <polygon
          points="105,255 112,275 133,275 116,288 122,308 105,296 88,308 94,288 77,275 98,275"
          fill={starFill}
        />
      </g>

      {/* Right Wing Petal */}
      <g id="right-wing">
        <path
          d="M 305 240 C 320 205 370 200 435 210 C 485 218 502 245 498 280 C 490 330 465 390 445 425 C 455 375 420 340 360 340 C 330 340 312 358 305 375 Z"
          fill={wingFill}
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />
        {/* Right Star */}
        <polygon
          points="395,255 402,275 423,275 406,288 412,308 395,296 378,308 384,288 367,275 388,275"
          fill={starFill}
        />
      </g>

      {/* Bottom Lily Tie & Lower Pedestal */}
      <g id="bottom-base">
        {/* Left Bottom Flare */}
        <path
          d="M 188 410 C 185 440 170 458 120 464 C 155 460 185 450 190 410 Z"
          fill={bottomWingFill}
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />
        {/* Right Bottom Flare */}
        <path
          d="M 312 410 C 315 440 330 458 380 464 C 345 460 315 450 310 410 Z"
          fill={bottomWingFill}
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />
        {/* Center Lower Arrow Base */}
        <path
          d="M 194 410 L 205 480 L 250 510 L 295 480 L 306 410 Z"
          fill={bottomCenterFill}
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />
        {/* Center Lower Spine */}
        <path
          d="M 250 415 L 250 490"
          stroke={strokeColor}
          strokeWidth={5}
          strokeLinecap="round"
        />
      </g>

      {/* Banner (ASG ROVERS) */}
      <g id="banner">
        <path
          d="M 160 365 L 340 365 L 358 385 L 340 405 L 160 405 L 142 385 Z"
          fill={bannerFill}
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />
        <text
          x="250"
          y="392"
          fontFamily="'Times New Roman', Georgia, serif"
          fontSize="24"
          fontWeight="bold"
          fill={bannerText}
          textAnchor="middle"
          letterSpacing="1.5"
        >
          ASG ROVERS
        </text>
      </g>
    </svg>
  );
};
