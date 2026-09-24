import type { SVGProps } from "react";

/** A few SF Symbol-like glyphs, so the tracker reads like the iPhone app. */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = ({ size = 20, ...props }: IconProps) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  "aria-hidden": true,
  focusable: false,
  ...props,
});

const stroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** mountain.2.fill */
export const MountainsIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path
      fill="currentColor"
      d="M8.6 6.2c.4-.7 1.4-.7 1.8 0l3.3 5.6 1.2-1.9c.4-.7 1.4-.7 1.8 0l5 8.3c.4.7-.1 1.6-.9 1.6H3.2c-.8 0-1.3-.9-.9-1.6l6.3-12Z"
    />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path {...stroke} strokeWidth={2.6} d="m5 12.5 4.4 4.4L19 7.4" />
  </svg>
);

/** checkmark.seal.fill */
export const SealCheckIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path
      fill="currentColor"
      d="M10.3 1.9a2.4 2.4 0 0 1 3.4 0l1.3 1.2 1.8-.2a2.4 2.4 0 0 1 2.6 2.1l.2 1.8 1.4 1.1a2.4 2.4 0 0 1 .5 3.4l-1 1.5.4 1.8a2.4 2.4 0 0 1-1.8 2.9l-1.7.5-.8 1.6a2.4 2.4 0 0 1-3.2 1.1L12 20.8l-1.6.8a2.4 2.4 0 0 1-3.2-1.1l-.8-1.6-1.7-.5a2.4 2.4 0 0 1-1.8-2.9l.4-1.8-1-1.5a2.4 2.4 0 0 1 .5-3.4l1.4-1.1.2-1.8a2.4 2.4 0 0 1 2.6-2.1l1.8.2 1.3-1.2Z"
    />
    <path
      {...stroke}
      stroke="#fff"
      strokeWidth={2.2}
      d="m8 12.2 2.8 2.8L16.2 9.4"
    />
  </svg>
);

export const XIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path {...stroke} strokeWidth={2.6} d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </svg>
);

export const SearchIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle {...stroke} cx="10.5" cy="10.5" r="6.5" />
    <path {...stroke} d="m15.5 15.5 5 5" />
  </svg>
);

export const ChevronRightIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path {...stroke} strokeWidth={2.4} d="m9 5 7 7-7 7" />
  </svg>
);

export const LockIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect
      x="4.5"
      y="10.5"
      width="15"
      height="11"
      rx="2.5"
      fill="currentColor"
    />
    <path {...stroke} strokeWidth={2.4} d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);

/** location, or location.fill while following the walker. */
export const LocationIcon = ({
  filled,
  ...props
}: IconProps & { filled?: boolean }) => (
  <svg {...base(props)}>
    <path
      {...stroke}
      fill={filled ? "currentColor" : "none"}
      strokeWidth={1.9}
      d="M20.4 3.6 3.9 10.4c-.6.3-.6 1.2.1 1.3l7 1.3 1.3 7c.1.7 1 .8 1.3.1l6.8-16.5Z"
    />
  </svg>
);

/** square.3.layers.3d */
export const LayersIcon = ({
  filled,
  ...props
}: IconProps & { filled?: boolean }) => (
  <svg {...base(props)}>
    <path
      {...stroke}
      strokeWidth={1.9}
      fill={filled ? "currentColor" : "none"}
      d="m12 3 9 4.8-9 4.8-9-4.8L12 3Z"
    />
    <path
      {...stroke}
      strokeWidth={1.9}
      d="m3 12.2 9 4.8 9-4.8M3 16.4l9 4.8 9-4.8"
    />
  </svg>
);

export const BookIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path
      {...stroke}
      strokeWidth={1.9}
      d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5v-15Zm0 15A1.5 1.5 0 0 0 6.5 21H19v-3"
    />
  </svg>
);

export const ChartIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path
      {...stroke}
      strokeWidth={1.9}
      d="M4 20h16M7 16v-4M11 16V8M15 16v-6M19 16V5"
    />
  </svg>
);

export const PhotoIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect
      {...stroke}
      strokeWidth={1.8}
      x="6"
      y="3.5"
      width="15"
      height="12"
      rx="2.5"
    />
    <path {...stroke} strokeWidth={1.8} d="M3 8v10a2.5 2.5 0 0 0 2.5 2.5H17" />
    <path {...stroke} strokeWidth={1.8} d="m6.5 14 4-4 3 3 2-2 5 5" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path {...stroke} strokeWidth={2.4} d="M12 5v14M5 12h14" />
  </svg>
);

export const PrinterIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path
      {...stroke}
      strokeWidth={1.8}
      d="M7 8V3.5h10V8M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
    />
    <rect
      {...stroke}
      strokeWidth={1.8}
      x="7"
      y="13"
      width="10"
      height="7.5"
      rx="1"
    />
  </svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path
      {...stroke}
      strokeWidth={1.9}
      d="M4 6.5h16M9.5 6.5V4h5v2.5M6.5 6.5l1 13.5h9l1-13.5"
    />
  </svg>
);

export const ArrowUpToLineIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path {...stroke} d="M5 4h14M12 20V8.5M7 13l5-5 5 5" />
  </svg>
);

export const ArrowDownToLineIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path {...stroke} d="M5 20h14M12 4v11.5M7 11l5 5 5-5" />
  </svg>
);

export const FlagIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path {...stroke} d="M5 21V4M5 4.5c4-2.5 7 2.5 13 0v9c-6 2.5-9-2.5-13 0" />
  </svg>
);

export const ClockIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle {...stroke} cx="12" cy="12" r="8.5" />
    <path {...stroke} d="M12 7.5V12l3 2" />
  </svg>
);

export const PersonIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle fill="currentColor" cx="12" cy="8.5" r="4" />
    <path fill="currentColor" d="M4 19.5c0-3.6 3.6-6 8-6s8 2.4 8 6v.5H4v-.5Z" />
  </svg>
);
