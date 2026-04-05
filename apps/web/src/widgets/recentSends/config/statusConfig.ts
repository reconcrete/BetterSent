import { Clock, LoaderCircle, Check, X } from "lucide-react";

export const statusConfig = {
  pending: { icon: Clock, label: "Pending", className: "text-[#929495]" },
  processing: {
    icon: LoaderCircle,
    label: "Sending",
    className: "text-[#a16207] dark:text-[#fff27c]",
  },
  completed: {
    icon: Check,
    label: "Delivered",
    className: "text-[#30c68f] dark:text-[#3ddca2]",
  },
  error: {
    icon: X,
    label: "Failed",
    className: "text-[#f3434b]",
  },
} as const;
