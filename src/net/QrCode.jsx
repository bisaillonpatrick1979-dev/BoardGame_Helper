// Code QR dessiné en SVG (bibliothèque qrcode-generator, licence MIT)
import { useMemo } from "react";
import qrcode from "qrcode-generator";

export default function QrCode({ text, size = 200 }) {
  const { path, count } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r += 1) {
      for (let c = 0; c < n; c += 1) {
        if (qr.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
      }
    }
    return { path: d, count: n + 8 };
  }, [text]);

  return (
    <svg className="qrCode" viewBox={`0 0 ${count} ${count}`} width={size} height={size} shapeRendering="crispEdges" role="img" aria-label="QR">
      <rect width={count} height={count} fill="#fff" />
      <path d={path} fill="#0b1020" />
    </svg>
  );
}
