"use client";

import Image, { type ImageProps } from "next/image";

type ExternalImageProps = Omit<ImageProps, "loader">;

export default function ExternalImage(props: ExternalImageProps) {
  return <Image loader={({ src }) => src} unoptimized {...props} />;
}
