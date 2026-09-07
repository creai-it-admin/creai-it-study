"use client";

import { useLiveState } from "@/components/useLiveState";

/** 세션이 시작되면 3초 안에 그 구간 화면으로 옮긴다. */
export function HomeWatcher() {
  useLiveState();
  return null;
}
