import sharp from 'sharp';

/**
 * 将SVG内容转换为PNG
 * @param svgContent SVG内容字符串
 * @param width PNG输出宽度，默认512
 * @param height PNG输出高度，默认512
 * @returns PNG Buffer
 */
export async function convertSvgToPng(
  svgContent: string, 
  width: number = 512, 
  height: number = 512
): Promise<Buffer> {
  try {
    const pngBuffer = await sharp(Buffer.from(svgContent))
      .png()
      .resize(width, height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // 白色背景
      })
      .toBuffer();
    
    return pngBuffer;
  } catch (error) {
    console.error('SVG to PNG conversion failed:', error);
    throw new Error('SVG转换失败');
  }
}

/**
 * 从URL下载SVG并转换为PNG
 * @param svgUrl SVG图片URL
 * @param width PNG输出宽度，默认512
 * @param height PNG输出高度，默认512
 * @returns PNG Buffer
 */
export async function downloadSvgAndConvertToPng(
  svgUrl: string,
  width: number = 512,
  height: number = 512
): Promise<Buffer> {
  try {
    // 下载SVG内容
    const response = await fetch(svgUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch SVG: ${response.status} ${response.statusText}`);
    }
    
    const svgContent = await response.text();
    console.log('📥 SVG下载成功，大小:', svgContent.length, 'bytes');
    
    // 转换为PNG
    const pngBuffer = await convertSvgToPng(svgContent, width, height);
    console.log('🎨 PNG转换成功，大小:', pngBuffer.length, 'bytes');
    
    return pngBuffer;
  } catch (error) {
    console.error('Download and convert SVG failed:', error);
    throw error;
  }
}