import { Bell, Bookmark, Briefcase, Flag, Heart, Home, Search, Star, Tag, TriangleAlert, type LucideIcon } from "lucide-react";
import type { LabelIconName } from "@shared/labels";

export const LABEL_ICON_COMPONENTS: Record<LabelIconName, LucideIcon> = {
  tag: Tag,
  star: Star,
  flag: Flag,
  bookmark: Bookmark,
  bell: Bell,
  heart: Heart,
  briefcase: Briefcase,
  house: Home,
  search: Search,
  "triangle-alert": TriangleAlert,
};
