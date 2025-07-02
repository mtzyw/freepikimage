import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    // 验证用户登录
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 获取参数
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const filename = searchParams.get('filename');

    if (!url) {
      return NextResponse.json(
        { error: "Missing url parameter" },
        { status: 400 }
      );
    }

    // 验证URL是否来自可信域名
    const allowedDomains = [
      process.env.STORAGE_DOMAIN,
      'airewrite.ai',
      'your-r2-domain.com' // 替换为你的R2域名
    ].filter(Boolean);

    const urlObj = new URL(url);
    const isAllowed = allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Invalid download URL" },
        { status: 403 }
      );
    }

    // 获取文件
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch file" },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    
    // 确定Content-Type
    let contentType = response.headers.get('content-type') || 'application/octet-stream';
    if (filename) {
      if (filename.endsWith('.svg')) {
        contentType = 'image/svg+xml';
      } else if (filename.endsWith('.png')) {
        contentType = 'image/png';
      }
    }

    // 返回文件
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename || 'download'}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Download proxy error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}