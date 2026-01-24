import { NextRequest, NextResponse } from 'next/server';
import { RoutineTypeModal } from '@/../../lib/db';

/**
 * GET /api/routine-types
 * 获取所有的 routine types
 * 支持通过 sport 参数筛选运动类型
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const sportOnly = searchParams.get('sport') === 'true';
		const showOnly = searchParams.get('show') === 'true';

		const where: any = {};
		
		if (sportOnly) {
			where.sport = true;
		}
		
		if (showOnly) {
			where.show = true;
		}

		const routineTypes = await RoutineTypeModal.findAll({
			where,
			order: [['id', 'ASC']],
		});

		return NextResponse.json({
			success: true,
			data: routineTypes,
		});
	} catch (error: any) {
		console.error('获取 routine types 失败:', error);
		return NextResponse.json(
			{
				success: false,
				message: error.message || '获取 routine types 失败',
			},
			{ status: 500 }
		);
	}
}

/**
 * POST /api/routine-types
 * 创建新的 routine type
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { type, des, show = true, sport = false } = body;

		if (!type) {
			return NextResponse.json(
				{
					success: false,
					message: 'type 字段是必填的',
				},
				{ status: 400 }
			);
		}

		// 检查是否已存在
		const existing = await RoutineTypeModal.findOne({
			where: { type },
		});

		if (existing) {
			return NextResponse.json(
				{
					success: false,
					message: '该类型已存在',
				},
				{ status: 400 }
			);
		}

		const newRoutineType = await RoutineTypeModal.create({
			type,
			des: des || type,
			show,
			sport,
		});

		return NextResponse.json({
			success: true,
			data: newRoutineType,
			message: '创建成功',
		});
	} catch (error: any) {
		console.error('创建 routine type 失败:', error);
		return NextResponse.json(
			{
				success: false,
				message: error.message || '创建失败',
			},
			{ status: 500 }
		);
	}
}

/**
 * PUT /api/routine-types
 * 更新 routine type
 */
export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();
		const { id, type, des, show, sport } = body;

		if (!id) {
			return NextResponse.json(
				{
					success: false,
					message: 'id 字段是必填的',
				},
				{ status: 400 }
			);
		}

		const routineType = await RoutineTypeModal.findByPk(id);

		if (!routineType) {
			return NextResponse.json(
				{
					success: false,
					message: '该类型不存在',
				},
				{ status: 404 }
			);
		}

		const updateData: any = {};
		if (type !== undefined) updateData.type = type;
		if (des !== undefined) updateData.des = des;
		if (show !== undefined) updateData.show = show;
		if (sport !== undefined) updateData.sport = sport;

		await routineType.update(updateData);

		return NextResponse.json({
			success: true,
			data: routineType,
			message: '更新成功',
		});
	} catch (error: any) {
		console.error('更新 routine type 失败:', error);
		return NextResponse.json(
			{
				success: false,
				message: error.message || '更新失败',
			},
			{ status: 500 }
		);
	}
}
