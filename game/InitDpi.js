// 初始化主要画布的代码

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 获取设备像素比
const dpr = window.devicePixelRatio || 1;

// 与CSS完全一致的尺寸
const CSS_WIDTH = canvas.width; // 缩小后的宽度
const CSS_HEIGHT = canvas.height; // 缩小后的高度
const boundaryMargin = 0; // 没有边距，完全匹配边框



function init_dpi() {
    // 设置Canvas像素尺寸（考虑dpr）
    canvas.width = CSS_WIDTH * dpr;
    canvas.height = CSS_HEIGHT * dpr;

    // 设置CSS显示尺寸（必须与CSS一致）
    canvas.style.width = `${CSS_WIDTH}px`;
    canvas.style.height = `${CSS_HEIGHT}px`;

    // 缩放上下文解决模糊问题
    ctx.scale(dpr, dpr);

    // 设置大号字体（清晰显示emoji）
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `40px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
}

export {init_dpi, dpr, canvas, ctx, CSS_HEIGHT, CSS_WIDTH, boundaryMargin};