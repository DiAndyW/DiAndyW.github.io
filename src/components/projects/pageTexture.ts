// Transient page-turn artwork only. The resting page always remains real HTML.
export function pageTexture(root: HTMLElement): HTMLCanvasElement {
    const surface = root.closest<HTMLElement>('[data-notebook-surface]');
    const transform = surface?.style.transform;
    // DOM ranges report projected rectangles. Capture in the sheet's own coordinates;
    // this synchronous change is restored before the browser paints.
    if (surface) surface.style.transform = 'none';
    try {
        return renderPageTexture(root);
    } finally {
        if (surface) surface.style.transform = transform || '';
    }
}

function renderPageTexture(root: HTMLElement): HTMLCanvasElement {
    const bounds = root.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(bounds.width * scale);
    canvas.height = Math.ceil(bounds.height * scale);
    const context = canvas.getContext('2d')!;
    context.scale(scale, scale);
    const paperStyle = getComputedStyle(root);
    context.fillStyle = paperStyle.backgroundColor;
    context.fillRect(0, 0, bounds.width, bounds.height);
    const spacing = parseFloat(getComputedStyle(root).backgroundSize.split(' ')[1]) || 24;
    context.strokeStyle = paperStyle.getPropertyValue('--notebook-rule').trim() || 'rgba(123,179,209,.08)';
    context.lineWidth = 1;
    for (let y = 0.5; y < bounds.height; y += spacing) {
        context.beginPath(); context.moveTo(0, y); context.lineTo(bounds.width, y); context.stroke();
    }
    const baselines = new Map<string, number>();
    function baselineFor(style: CSSStyleDeclaration) {
        const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const cached = baselines.get(font);
        if (cached !== undefined) return cached;
        const probe = document.createElement('div');
        probe.style.cssText = 'position:fixed;left:-9999px;top:0;white-space:nowrap;visibility:hidden;pointer-events:none';
        probe.style.font = font;
        const text = document.createElement('span');
        text.textContent = 'Hg';
        const marker = document.createElement('i');
        marker.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
        probe.append(text, marker);
        document.body.append(probe);
        try {
            const offset = marker.getBoundingClientRect().top - text.getBoundingClientRect().top;
            baselines.set(font, offset);
            return offset;
        } finally { probe.remove(); }
    }

    function walk(node: Node) {
        if (node instanceof HTMLElement) {
            const style = getComputedStyle(node);
            if (style.display === 'none' || node.classList.contains('sr-only') || node.tagName === 'DIALOG') return;
            const rect = node.getBoundingClientRect();
            context.save();
            if (/auto|hidden|scroll|clip/.test(style.overflowX + style.overflowY)) {
                context.beginPath(); context.rect(rect.x - bounds.x, rect.y - bounds.y, rect.width, rect.height); context.clip();
            }
            if (node !== root && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                context.fillStyle = style.backgroundColor;
                context.beginPath();
                context.roundRect(rect.x - bounds.x, rect.y - bounds.y, rect.width, rect.height, parseFloat(style.borderRadius) || 0);
                context.fill();
            }
            if (node instanceof HTMLImageElement) {
                if (node.complete && node.naturalWidth) context.drawImage(node, rect.x - bounds.x, rect.y - bounds.y, rect.width, rect.height);
            } else {
                for (const child of node.childNodes) walk(child);
            }
            context.restore();
        } else if (node instanceof SVGSVGElement) {
            // SVG motifs are drawn synchronously using their primitive geometry, including transforms.
            const box = node.getBoundingClientRect();
            const view = node.viewBox.baseVal;
            context.save();
            context.translate(box.x - bounds.x, box.y - bounds.y);
            context.scale(box.width / view.width, box.height / view.height);
            for (const element of node.querySelectorAll('rect, circle, ellipse, path')) {
                context.save();
                const matrix = (element as SVGGraphicsElement).transform.baseVal.consolidate()?.matrix;
                if (matrix) context.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
                const n = (key: string) => parseFloat(element.getAttribute(key) || '0');
                context.globalAlpha = parseFloat(element.getAttribute('opacity') || '1');
                let path: Path2D;
                if (element.tagName === 'path') path = new Path2D(element.getAttribute('d') || '');
                else {
                    path = new Path2D();
                    if (element.tagName === 'rect') path.roundRect(n('x'), n('y'), n('width'), n('height'), n('rx'));
                    else path.ellipse(n('cx'), n('cy'), element.tagName === 'circle' ? n('r') : n('rx'), element.tagName === 'circle' ? n('r') : n('ry'), 0, 0, Math.PI * 2);
                }
                const fill = element.getAttribute('fill');
                if (fill !== 'none') { context.fillStyle = fill || '#111827'; context.fill(path); }
                const stroke = element.getAttribute('stroke');
                if (stroke && stroke !== 'none') {
                    context.strokeStyle = stroke;
                    context.lineWidth = n('stroke-width') || 1;
                    context.lineCap = (element.getAttribute('stroke-linecap') || 'butt') as CanvasLineCap;
                    context.setLineDash((element.getAttribute('stroke-dasharray') || '').split(/[ ,]/).filter(Boolean).map(Number));
                    context.stroke(path);
                }
                context.restore();
            }
            context.restore();
        } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
            const parent = node.parentElement!;
            const style = getComputedStyle(parent);
            context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            context.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
            context.fillStyle = style.color;
            context.textBaseline = 'alphabetic';
            const range = document.createRange();
            const text = node.textContent;
            let line = '', x = 0, y = 0, previousY = -Infinity;
            const draw = () => {
                if (line) context.fillText(line, x - bounds.x, y - bounds.y);
            };
            for (let i = 0; i < text.length; i++) {
                range.setStart(node, i); range.setEnd(node, i + 1);
                const rect = range.getBoundingClientRect();
                if (!rect.width || !rect.height) continue;
                if (Math.abs(rect.y - previousY) > 2) {
                    draw(); line = ''; x = rect.x;
                    y = rect.y + baselineFor(style);
                }
                line += text[i]; previousY = rect.y;
            }
            draw();
        }
    }
    for (const node of root.childNodes) walk(node);
    return canvas;
}
