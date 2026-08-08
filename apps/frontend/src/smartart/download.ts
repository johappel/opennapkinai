function triggerDownload(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser a moment to start the download before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function serializeSvg(svg: SVGSVGElement): { svgStr: string; width: number; height: number } {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const viewBox = svg.viewBox.baseVal;
    const width = viewBox && viewBox.width ? viewBox.width : svg.clientWidth || 800;
    const height = viewBox && viewBox.height ? viewBox.height : svg.clientHeight || 600;
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));

    const svgStr = new XMLSerializer().serializeToString(clone);
    return { svgStr, width, height };
}

export function downloadSmartArtAsSvg(svg: SVGSVGElement, filename = "smartart.svg") {
    const { svgStr } = serializeSvg(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    triggerDownload(URL.createObjectURL(blob), filename);
}

export function downloadSmartArtAsPng(svg: SVGSVGElement, filename = "smartart.png", scale = 2) {
    const { svgStr, width, height } = serializeSvg(svg);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            URL.revokeObjectURL(url);
            return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
            if (blob) triggerDownload(URL.createObjectURL(blob), filename);
        }, "image/png");
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
}
