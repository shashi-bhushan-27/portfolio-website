import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string, style: "long" | "short" | "iso" = "long") {
  const d = new Date(iso);
  if (style === "iso") return d.toISOString().slice(0, 10);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: style === "long" ? "long" : "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.round((now - new Date(iso).getTime()) / 1000);
  if (s < 45) return "just now";
  const units: [number, string][] = [
    [60, "min"],
    [60, "h"],
    [24, "d"],
    [30, "mo"],
    [12, "y"],
  ];
  let value = s / 60;
  let unit = "min";
  for (let i = 1; i < units.length && value >= units[i][0]; i++) {
    value /= units[i][0];
    unit = units[i][1];
  }
  return `${Math.floor(value)} ${unit} ago`;
}
