import type { LayoutConnector } from "./types";
import COLORS from "../data/colors";

type Props = {
    connector: LayoutConnector;
    theme: keyof typeof COLORS;
};

/** Renders a single connector path (arrow / curved link) between two nodes. */
export default function SmartArtConnector({ connector, theme }: Props) {
    const palette = COLORS[theme];
    const color = palette[connector.colorIndex % palette.length];

    return <path d={connector.d} fill="none" stroke={color} strokeWidth={2} markerEnd="url(#smartart-arrowhead)" />;
}
