import { PlannerLayout } from "@/planner/PlannerLayout";

export const metadata = {
  title: "Blaze — Coordinate Planner",
  description:
    "Visually author 3D motion paths through your page and export a portable JSON CoordinateMap.",
};

export default function PlannerPage() {
  return <PlannerLayout />;
}
