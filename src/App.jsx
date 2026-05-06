import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dice6,
  Timer,
  Trophy,
  Wallet,
  Cards,
  Shuffle,
  Lock,
  Home,
  RotateCcw,
  Plus,
  Minus
} from "lucide-react";

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "dice", label: "Dice", icon: Dice6 },
  { id: "timer", label: "Timer", icon: Timer },
  { id: "score", label: "Score", icon: Trophy },
  { id: "premium", label: "Premium", icon: Lock }
];

const diceTypes = [4, 6, 8, 10, 12, 20];

function randomRoll(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

export default function App() {
  const [activeTab, setActive
