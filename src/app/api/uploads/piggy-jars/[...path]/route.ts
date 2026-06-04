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

		let baseUploadDir: string
		if (process.env.UPLOAD_DIR) {
			baseUploadDir = process.env.UPLOAD_DIR
		} else {
			const dockerUploadDir = '/app/uploads'
			if (existsSync(dockerUploadDir)) {
				baseUploadDir = dockerUploadDir
			} else {
				baseUploadDir = path.join(process.cwd(), 'public', 'uploads')
			}
		}

		const fullPath = path.join(baseUploadDir, 'piggy-jars', ...filePath)

		const resolvedPath = path.resolve(fullPath)
		const resolvedBaseDir = path.resolve(baseUploadDir, 'piggy-jars')

		const rel = path.relative(resolvedBaseDir, resolvedPath)
		const isInside =
			rel === '' ||
			(!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel))

		if (!isInside) {
			return NextResponse.json(
				{ success: false, message: '访问被拒绝' },
				{ status: 403 }
			)
		}

		if (!existsSync(resolvedPath)) {
			return NextResponse.json(
				{ success: false, message: '文件不存在' },
				{ status: 404 }
			)
		}

		const fileBuffer = await readFile(resolvedPath)

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
				'Cache-Control': 'public, max-age=31536000, immutable',
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

