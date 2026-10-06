(() => {
  const MiB = 1024 * 1024;
  const canvasBlob = (canvas, quality) => new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('图片压缩失败')), 'image/jpeg', quality);
  });

  async function compressCanvas(source, options = {}) {
    if (!source || !source.width || !source.height) throw new Error('请先选择并处理图片');
    const maxBytes = Math.min(5 * MiB, Math.max(256 * 1024, Number(options.maxBytes) || 4 * MiB));
    const maxEdge = Math.max(640, Math.min(3200, Number(options.maxEdge) || 2600));
    const originalEdge = Math.max(source.width, source.height);
    let scale = Math.min(1, maxEdge / originalEdge);
    const qualities = [Number(options.quality) || 0.9, 0.84, 0.78, 0.72, 0.66, 0.6, 0.54, 0.48];

    for (let resize = 0; resize < 9; resize++) {
      const output = document.createElement('canvas');
      output.width = Math.max(1, Math.round(source.width * scale));
      output.height = Math.max(1, Math.round(source.height * scale));
      const context = output.getContext('2d', { alpha: false });
      context.fillStyle = '#fff';
      context.fillRect(0, 0, output.width, output.height);
      context.drawImage(source, 0, 0, output.width, output.height);
      for (const quality of qualities) {
        const blob = await canvasBlob(output, quality);
        if (blob.size <= maxBytes) return blob;
      }
      if (Math.max(output.width, output.height) <= 800) break;
      scale *= 0.82;
    }
    throw new Error(`图片压缩后仍超过 ${(maxBytes / MiB).toFixed(1)} MB，请裁剪图片或选择更低的体积上限`);
  }

  async function compressImageFile(file, options = {}) {
    if (!(file instanceof Blob) || file.size < 1) throw new Error('请选择有效图片');
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
})();
