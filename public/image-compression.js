(() => {
  const MiB = 1024 * 1024;
  const MAX_BYTES = MiB;
  const MAX_EDGE = 1280;
  const WEBP = 'image/webp';

  function canvasBlob(canvas, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('图片压缩失败'));
        if (blob.type !== WEBP) return reject(new Error('当前浏览器不能导出 WebP，请升级浏览器后重试'));
        resolve(blob);
      }, WEBP, quality);
    });
  }

  async function compressCanvas(source, options = {}) {
    if (!source || !source.width || !source.height) throw new Error('请先选择并处理图片');
    const maxBytes = Math.min(MAX_BYTES, Math.max(64 * 1024, Number(options.maxBytes) || MAX_BYTES));
    const maxEdge = Math.min(MAX_EDGE, Math.max(1, Number(options.maxEdge) || MAX_EDGE));
    const originalEdge = Math.max(source.width, source.height);
    let scale = Math.min(1, maxEdge / originalEdge);
    const initialQuality = Math.max(0.35, Math.min(0.95, Number(options.quality) || 0.9));
    const qualities = [...new Set([initialQuality, 0.84, 0.78, 0.72, 0.66, 0.6, 0.54, 0.48, 0.42, 0.36])];

    for (let resize = 0; resize < 12; resize++) {
      const output = document.createElement('canvas');
      output.width = Math.max(1, Math.min(maxEdge, Math.round(source.width * scale)));
      output.height = Math.max(1, Math.min(maxEdge, Math.round(source.height * scale)));
      const context = output.getContext('2d', { alpha: options.preserveAlpha === true });
      if (!context) throw new Error('当前浏览器无法处理图片');
      if (options.preserveAlpha !== true) {
        context.fillStyle = '#fff';
        context.fillRect(0, 0, output.width, output.height);
      }
      context.drawImage(source, 0, 0, output.width, output.height);
      for (const quality of qualities) {
        const blob = await canvasBlob(output, quality);
        if (blob.size <= maxBytes) return blob;
      }
      if (Math.max(output.width, output.height) <= 320) break;
      scale *= 0.82;
    }
    throw new Error(`图片压缩后仍超过 ${(maxBytes / MiB).toFixed(1)} MB，请继续裁剪后重试`);
  }

  async function validateSource(file) {
    const name = String(file.name || '').toLowerCase();
    const type = String(file.type || '').toLowerCase();
    const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const png = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
    const jpegName = /\.jpe?g$/.test(name), pngName = /\.png$/.test(name);
    const jpegType = type === 'image/jpeg' || type === 'image/jpg' || type === 'image/pjpeg';
    const pngType = type === 'image/png';
    if (jpeg && (jpegName || jpegType) && (!type || jpegType) && (!name || jpegName)) return;
    if (png && (pngName || pngType) && (!type || pngType) && (!name || pngName)) return;
    throw new Error('仅支持 JPEG、JPG 或 PNG 图片');
  }

  async function compressImageFile(file, options = {}) {
    if (!(file instanceof Blob) || file.size < 1) throw new Error('请选择有效图片');
    await validateSource(file);
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      return await compressCanvas(bitmap, options);
    } catch (error) {
      if (error?.name === 'NotSupportedError' || typeof createImageBitmap !== 'function') {
        const objectUrl = URL.createObjectURL(file);
        try {
          const image = new Image();
          image.src = objectUrl;
          await image.decode();
          return await compressCanvas(image, options);
        } finally { URL.revokeObjectURL(objectUrl); }
      }
      throw error;
    } finally { bitmap?.close?.(); }
  }

  window.bpmCompressCanvas = compressCanvas;
  window.bpmCompressImageFile = compressImageFile;
  window.bpmValidateImageFile = validateSource;
  window.bpmImagePolicy = Object.freeze({ maxEdge: MAX_EDGE, maxBytes: MAX_BYTES, outputType: WEBP, inputTypes: ['image/jpeg', 'image/jpg', 'image/png'] });
})();
