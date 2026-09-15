import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  sub?: string;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
};

export default function KpiCard({
  label,
  value,
  sub,
  icon,
  iconBg,
  iconColor,
  onClick,
}: Props) {
  return (
    <div
      className="card"
      style={{
        padding: "18px 20px",
        cursor: onClick ? "pointer" : undefined,
        transition: "transform .15s, box-shadow .15s",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 12px 30px -14px rgba(15,23,42,.22)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".3px",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          {label}
        </div>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: iconBg,
            color: iconColor,
            display: "grid",
            placeItems: "center",
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          fontSize: 27,
          fontWeight: 800,
          letterSpacing: "-1px",
          lineHeight: 1.1,
          marginBottom: 5,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}