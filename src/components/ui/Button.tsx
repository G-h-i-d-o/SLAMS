import { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
  icon?: ReactNode;
  children: ReactNode;
};

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  className = "",
  ...rest
}: Props) {
  const cls = [
    "btn",
    variant === "primary" ? "btn-primary"
      : variant === "danger" ? "btn-danger"
      : "btn-ghost",
    size === "sm" ? "btn-sm" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button className={cls} {...rest}>
      {icon}
      {children}
    </button>
  );
}