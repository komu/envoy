import {ReactElement} from "react";

type ButtonType = "default" | "approve" | "deny";

export function Button({onClick, children, type, icon, disabled}: {
  onClick: () => void,
  children: string,
  type?: ButtonType,
  icon?: ReactElement,
  disabled?: boolean,
}) {
  const colorClass = colorClasses[type ?? "default"];
  const classes = `${colorClass} text-white px-4 py-2 rounded-md transition-colors`;
  return <button onClick={onClick} className={classes} disabled={disabled}>
    {icon} {children}
  </button>;
}

const colorClasses: Record<ButtonType, string> = {
  default: "bg-indigo-600 hover:bg-indigo-700",
  approve: "bg-green-600 hover:bg-green-700",
  deny: "bg-red-600 hover:bg-red-700",
};
