import React, { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  secondaryfill?: string;
  strokewidth?: number;
  title?: string;
};

interface LogoProps extends Omit<IconProps, "width" | "height"> {
  size?: number | string;
}

export function Logo({
  fill = "currentColor",
  secondaryfill,
  size = 20,
  className,
  ...props
}: LogoProps) {
  secondaryfill = secondaryfill || fill;
  const sizeValue = typeof size === "number" ? `${size}px` : size;

  return (
    <svg
      height={sizeValue}
      width={sizeValue}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Scrowl logo"
      {...props}
    >
      <g fill={fill}>
        <circle
          cx="10"
          cy="10"
          fill={fill}
          r="7"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}

