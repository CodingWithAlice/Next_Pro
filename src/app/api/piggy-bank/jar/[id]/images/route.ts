import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { PiggyBankJarModal } from 'db'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'

function buildStorageBaseDir(): { baseUploadDir: string; isExternalDir: boolean } {
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

	const defaultPublicDir = path.join(process.cwd(), 'public', 'uploads')
	const resolvedBaseDir = path.resolve(baseUploadDir)
	const resolvedDefaultDir = path.resolve(defaultPublicDir)
	const isExternalDir = !!process.env.UPLOAD_DIR || resolvedBaseDir !== resolvedDefaultDir
	return { baseUploadDir, isExternalDir }
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const { id } = await params
		const jarId = parseInt(id, 10)
		if (!jarId || jarId <= 0) {
			return NextResponse.json(
				{ success: false, message: '罐子ID无效' },
				{ status: 400 }
			)
		}

		const jar = await PiggyBankJarModal.findOne({ where: { id: jarId, userId } })
		if (!jar) {
			return NextResponse.json(
				{ success: false, message: '罐子不存在' },
				{ status: 404 }
			)
		}

		const formData = await request.formData()
		const file = formData.get('file') as File
		const name = (formData.get('name') as string | null) ?? (jar.get('name') as string | null)

		if (!file) {
			return NextResponse.json(
				{ success: false, message: '请选择要上传的图片' },
				{ status: 400 }
			)
		}

		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json(
				{ success: false, message: '只支持 jpg、jpeg、png、webp 格式的图片' },
				{ status: 400 }
			)
		}

		const maxSize = 5 * 1024 * 1024
		if (file.size > maxSize) {
			return NextResponse.json(
				{ success: false, message: '图片大小不能超过 5MB' },
				{ status: 400 }
			)
		}

		const ext = path.extname(file.name).toLowerCase()

		const base = name && String(name).trim()
			? String(name).trim()
				.replace(/[<>:"/\\|?*]/g, '')
				.replace(/\s+/g, '_')
			: ''
		const isValidBaseName = !!base && !/^\.+$/.test(base)

		const year = new Date().getFullYear().toString()
		const { baseUploadDir, isExternalDir } = buildStorageBaseDir()

		const uploadDir = path.join(baseUploadDir, 'piggy-jars', String(jarId), year)
		if (!existsSync(uploadDir)) {
			await mkdir(uploadDir, { recursive: true })
		}

		let fileName = isValidBaseName ? `${base}_${Date.now()}${ext}` : `${Date.now()}${ext}`

		const filePath = path.join(uploadDir, fileName)
		if (existsSync(filePath)) {
			const nameWithoutExt = path.basename(fileName, ext)
			fileName = `${nameWithoutExt}_${Date.now()}${ext}`
		}

		const bytes = await file.arrayBuffer()
		const buffer = Buffer.from(bytes)
		const finalPath = path.join(uploadDir, fileName)
		await writeFile(finalPath, buffer)

		const fileUrl = isExternalDir
			? `/api/uploads/piggy-jars/${jarId}/${year}/${fileName}`
			: `/uploads/piggy-jars/${jarId}/${year}/${fileName}`

		await jar.update({ imageUrl: fileUrl })

		return NextResponse.json({
			success: true,
			message: '上传成功',
			data: {
				url: fileUrl,
				imageUrl: fileUrl,
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

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const { id } = await params
		const jarId = parseInt(id, 10)
		if (!jarId || jarId <= 0) {
			return NextResponse.json(
				{ success: false, message: '罐子ID无效' },
				{ status: 400 }
			)
		}

		const jar = await PiggyBankJarModal.findOne({ where: { id: jarId, userId } })
		if (!jar) {
			return NextResponse.json(
				{ success: false, message: '罐子不存在' },
				{ status: 404 }
			)
		}

		await jar.update({ imageUrl: null })

		return NextResponse.json({
			success: true,
			message: '已移除',
			data: { imageUrl: null },
		})
	} catch (error) {
		console.error('移除图片失败:', error)
		return NextResponse.json(
			{
				success: false,
				message: '操作失败',
				error: (error as Error).message,
			},
			{ status: 500 }
		)
	}
}

