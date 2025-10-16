// components/PostImage.tsx
"use client";
import Image, { type ImageProps } from "next/image";
import clsx from "clsx";

type Props = Omit<ImageProps, "src" | "alt" | "fill"> & {
  src: string;       // e.g. "/images/spending-patterns/img_123.png"
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  rounded?: boolean;
};

export default function PostImage({
  src,
  alt,
  width = 1200,
  height = 675,
  className,
  rounded = true,
  ...rest
}: Props) {
  return (
    <div className={clsx("relative w-full", className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 768px) 100vw, 768px"
        className={clsx("h-auto w-full", rounded && "rounded-2xl")}
        {...rest}
      />
    </div>
  );
}
