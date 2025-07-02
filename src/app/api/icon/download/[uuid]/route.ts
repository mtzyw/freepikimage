import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { IconGenerationModel } from "@/models/icon-generation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    // 1. 验证用户登录
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. 获取参数
    const { uuid } = await params;

    // 3. 查询生成记录
    const generation = await IconGenerationModel.findByUserAndUuid(
      session.user.uuid,
      uuid
    );

    if (!generation || generation.status !== 'completed') {
      return NextResponse.json(
        { error: "Icon not found or not completed" },
        { status: 404 }
      );
    }

    if (!generation.r2_url) {
      console.log('No R2 URL found for generation:', generation.uuid);
      return NextResponse.json(
        { error: "Download URL not available" },
        { status: 404 }
      );
    }

    console.log('Downloading file from R2 URL:', generation.r2_url);

    // 3. 从 R2 获取文件
    try {
      const fileResponse = await fetch(generation.r2_url);
      
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.status}`);
      }

      const fileBuffer = await fileResponse.arrayBuffer();

      // 4. 设置适当的响应头
      const headers = new Headers();
      headers.set('Content-Type', generation.format === 'svg' ? 'image/svg+xml' : 'image/png');
      headers.set('Content-Length', String(fileBuffer.byteLength));
      headers.set('Content-Disposition', `attachment; filename="icon-${generation.uuid}.${generation.format}"`);
      headers.set('Cache-Control', 'public, max-age=31536000'); // 缓存1年

      return new NextResponse(fileBuffer, {
        status: 200,
        headers
      });

    } catch (error) {
      console.error('File download error:', error);
      return NextResponse.json(
        { error: "Failed to download file" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}