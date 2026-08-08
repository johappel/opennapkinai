import type { Archetype, SmartArtNode, LayoutResult } from "../types";
import { layoutProcess } from "./process";
import { layoutCycle } from "./cycle";
import { layoutHierarchy } from "./hierarchy";
import { layoutPyramid } from "./pyramid";
import { layoutMatrix } from "./matrix";
import { layoutComparison } from "./comparison";

export function computeLayout(archetype: Archetype, nodes: SmartArtNode[]): LayoutResult {
    switch (archetype) {
        case "process":
            return layoutProcess(nodes);
        case "cycle":
            return layoutCycle(nodes);
        case "hierarchy":
            return layoutHierarchy(nodes);
        case "pyramid":
            return layoutPyramid(nodes);
        case "matrix":
            return layoutMatrix(nodes);
        case "comparison":
            return layoutComparison(nodes);
        default:
            return layoutProcess(nodes);
    }
}
