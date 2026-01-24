import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData()
		const file = formData.get('file') as File
		const title = formData.get('title') as string | null
		
		if (!file) {
			return NextResponse.json(
				{
					success: false,
					message: '请选择要上传的图片',
				},
				{ status: 400 }
			)
		}

		// 验证文件类型
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json(
				{
					success: false,
					message: '只支持 jpg、jpeg、png、webp 格式的图片',
				},
				{ status: 400 }
			)
		}

		// 验证文件大小（5MB）
		const maxSize = 5 * 1024 * 1024
		if (file.size > maxSize) {
			return NextResponse.json(
				{
					success: false,
					message: '图片大小不能超过 5MB',
				},
				{ status: 400 }
			)
		}

		// 获取文件扩展名
		const ext = path.extname(file.name).toLowerCase()
		
		// 生成文件名
		let fileName: string
		if (title && title.trim()) {
			// 使用标题作为文件名，清理特殊字符
			const sanitizedBaseName = title.trim()
				.replace(/[<>:"/\\|?*]/g, '') // 去除Windows不允许的字符
				.replace(/\s+/g, '_') // 空格替换为下划线

			// 如果清理后为空/仅点号（例如 "???"、"///"、"..."），回退为时间戳，避免生成 ".jpg" 这类隐藏文件名
			const isValidBaseName =
				!!sanitizedBaseName && !/^\.+$/.test(sanitizedBaseName)

			fileName = isValidBaseName
				? `${sanitizedBaseName}${ext}`
				: `${Date.now()}${ext}`
		} else {
			// 使用时间戳
			fileName = `${Date.now()}${ext}`
		}

		// 按年份组织目录
		const year = new Date().getFullYear().toString()
		// 确定上传目录：
		// 1. 优先使用环境变量 UPLOAD_DIR
		// 2. 如果没有环境变量，检查 /app/uploads 是否存在（Docker 环境）
		// 3. 否则使用默认的 public/uploads（开发环境）
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
		const uploadDir = path.join(baseUploadDir, 'books', year)
		
		// 确保目录存在
		if (!existsSync(uploadDir)) {
			await mkdir(uploadDir, { recursive: true })
		}

		// 如果文件已存在，添加时间戳后缀
		const filePath = path.join(uploadDir, fileName)
		if (existsSync(filePath)) {
			const nameWithoutExt = path.basename(fileName, ext)
			fileName = `${nameWithoutExt}_${Date.now()}${ext}`
		}

		// 读取文件内容
		const bytes = await file.arrayBuffer()
		const buffer = Buffer.from(bytes)

		// 保存文件
		const finalPath = path.join(uploadDir, fileName)
		await writeFile(finalPath, buffer)

		// 返回文件访问URL
		// 如果使用外部目录（/app/uploads 或设置了 UPLOAD_DIR），使用 API 路由访问
		// 如果使用默认的 public 目录，直接使用静态文件路径
		const isExternalDir = baseUploadDir !== path.join(process.cwd(), 'public', 'uploads')
		const fileUrl = isExternalDir 
			? `/api/uploads/books/${year}/${fileName}` 
			: `/uploads/books/${year}/${fileName}`

		return NextResponse.json({
			success: true,
			message: '上传成功',
			data: {
				url: fileUrl,
			},
		})
	} catch (error) {
		console.error('图片上传失败:', error)
		return NextResponse.json(
			{
				success: false,
				message: '上传失败',
				error: (error as Error).message,
			},
			{ status: 500 }
		)
	}
}

