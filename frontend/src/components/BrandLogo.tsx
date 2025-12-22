import Image from "next/image";

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export default function BrandLogo({
  size = 32,
  className = "",
}: BrandLogoProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt="Sarape Logo"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}
