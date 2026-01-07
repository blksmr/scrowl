import type { SVGProps } from "react";

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
  secondaryfill: _secondaryfill,
  size = 20,
  className,
  ...props
}: LogoProps) {
  const _fill = _secondaryfill || fill;
  void _fill;
  const sizeValue = typeof size === "number" ? `${size}px` : size;

  return (
    <svg
      height={sizeValue}
      width={sizeValue}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="domet logo"
      {...props}
    >
      <g fill={fill}>
        <path
          d="m14.25,15H3.75c-.4141,0-.75.3359-.75.75s.3359.75.75.75h10.5c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z"
          strokeWidth="0"
        ></path>
        <circle cx="9" cy="7.5" r="6" strokeWidth="0"></circle>
      </g>
    </svg>
  );
}
