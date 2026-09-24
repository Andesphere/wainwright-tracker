// PhoneFrame — an iPhone drawn in CSS around a real app screenshot.
// Screenshots are 1206×2622 (iPhone 17 Pro); next/image serves resized WebP.

import Image from "next/image";

type PhoneFrameProps = {
  src: string;
  alt: string;
  /** Rendered width hint for next/image, e.g. "(min-width: 960px) 300px, 60vw". */
  sizes: string;
  priority?: boolean;
  className?: string;
};

export function PhoneFrame({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: PhoneFrameProps) {
  return (
    <div className={className ? `phone ${className}` : "phone"}>
      <Image
        src={src}
        alt={alt}
        width={1206}
        height={2622}
        sizes={sizes}
        priority={priority}
        className="phone-screen"
      />
      <span className="phone-island" aria-hidden />
    </div>
  );
}
