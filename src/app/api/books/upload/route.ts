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
			fileName = title.trim()
				.replace(/[<>:"/\\|?*]/g, '') // 去除Windows不允许的字符
				.replace(/\s+/g, '_') // 空格替换为下划线
				+ ext
		} else {
			// 使用时间戳
			fileName = `${Date.now()}${ext}`
		}

		// 按年份组织目录
		const year = new Date().getFullYear().toString()
		const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'books', year)
		
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
		const fileUrl = `/uploads/books/${year}/${fileName}`

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

