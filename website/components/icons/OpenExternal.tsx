import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  secondaryfill?: string;
  strokewidth?: number;
  title?: string;
};

export function OpenExternal({
  fill = "currentColor",
  secondaryfill,
  width = "0.75rem",
  height = "0.75rem",
  ...props
}: IconProps) {
  const secondary = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        stroke={fill}
      >
        <polyline points="7.75 7.5 7.75 4.25 4.5 4.25"></polyline>
        <line x1="7.5" y1="4.5" x2=".75" y2="11.25"></line>
        <path d="m5.785,10.25h2.965c1.105,0,2-.895,2-2V2.75c0-1.105-.895-2-2-2H3.75c-1.105,0-2,.895-2,2v3.465"></path>
      </g>
    </svg>
  );
}
