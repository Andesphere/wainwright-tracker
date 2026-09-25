// PhoneFrame — an iPhone screenshot (1206×2622) inside a drawn bezel.
// The frame is pure CSS, sized with container units so it scales with
// whatever column it sits in. Styles live in styles/landing.css.

import Image from "next/image";

type PhoneFrameProps = {
  src: string;
  alt: string;
  /** Short line under the phone. */
  caption?: string;
  /** Only the hero phone is above the fold; everything else lazy-loads. */
  priority?: boolean;
  /** next/image sizes hint, e.g. "(min-width: 900px) 280px, 66vw". */
  sizes: string;
  className?: string;
};

export function PhoneFrame({
  src,
  alt,
  caption,
  priority = false,
  sizes,
  className,
}: PhoneFrameProps) {
  return (
    <figure className={className ? `phone ${className}` : "phone"}>
      <div className="phone-body">
        <div className="phone-screen">
          <span className="phone-island" aria-hidden />
          <Image
            src={src}
            alt={alt}
            width={1206}
            height={2622}
            sizes={sizes}
            priority={priority}
            quality={78}
          />
        </div>
      </div>
      {caption ? (
        <figcaption className="phone-cap">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
