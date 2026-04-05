import { Magazine } from "@/lib/magazines";

interface MagazineTitleProps {
  magazine: Magazine;
  className?: string;
  style?: React.CSSProperties;
}

export function MagazineTitle({ magazine, className = "", style }: MagazineTitleProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily: magazine.uiFont,
        fontWeight: magazine.uiFontWeight,
        ...style,
      }}
    >
      {magazine.name}
    </span>
  );
}
