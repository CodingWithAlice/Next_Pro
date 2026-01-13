import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> }
) {
	try {
		const { path: filePath } = await params
		
		if (!filePath || filePath.length === 0) {
			return NextResponse.json(
				{ success: false, message: '文件路径无效' },
				{ status: 400 }
			)
		}

		// 获取基础上传目录
		const baseUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads')
		const fullPath = path.join(baseUploadDir, 'books', ...filePath)

		// 安全检查：确保路径在允许的目录内
		const resolvedPath = path.resolve(fullPath)
		const resolvedBaseDir = path.resolve(baseUploadDir, 'books')
		if (!resolvedPath.startsWith(resolvedBaseDir)) {
			return NextResponse.json(
				{ success: false, message: '访问被拒绝' },
				{ status: 403 }
			)
		}

		// 检查文件是否存在
		if (!existsSync(resolvedPath)) {
			return NextResponse.json(
				{ success: false, message: '文件不存在' },
				{ status: 404 }
			)
		}

		// 读取文件
		const fileBuffer = await readFile(resolvedPath)
		
		// 根据文件扩展名确定 Content-Type
		const ext = path.extname(resolvedPath).toLowerCase()
		const contentTypeMap: Record<string, string> = {
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.webp': 'image/webp',
			'.gif': 'image/gif',
		}
		const contentType = contentTypeMap[ext] || 'application/octet-stream'

		return new NextResponse(new Uint8Array(fileBuffer), {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable', // 缓存一年
			},
		})
	} catch (error) {
		console.error('文件读取失败:', error)
		return NextResponse.json(
			{
				success: false,
				message: '文件读取失败',
				error: (error as Error).message,
			},
			{ status: 500 }
		)
	}
}

