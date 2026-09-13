import type { NextConfig } from 'next'
import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'

// Docker 挂载 /app/config.env；本地读仓库上一级共享 config.env
dotenv.config({ path: path.resolve(__dirname, './config.env') })
dotenv.config({ path: path.resolve(__dirname, '../config.env') })

const tsconfigPath = path.resolve(__dirname, 'tsconfig.json')
const tsconfigRaw = fs.readFileSync(tsconfigPath, 'utf-8')
const tsconfig = JSON.parse(tsconfigRaw)

// 在构建和运行时使用
const nextConfig: NextConfig = {
	webpack: (config) => {
		const alias: { [key: string]: string } = {}
		const paths = tsconfig.compilerOptions.paths
		if (paths) {
			Object.keys(paths).forEach((key) => {
				const newKey = key.replace('/*', '')
				const value = paths[key][0].replace('/*', '')
				alias[newKey] = path.resolve(__dirname, value)
			})
		}
		config.resolve.alias = {
			...config.resolve.alias,
			...alias,
		}
		return config
	},
	env: {
		// 勿在此暴露 DEEPSEEK_API_KEY / CHECK_AUTH / DB_*：next.config env 会打进前端包
		NEXT_PUBLIC_PIGGY_BANK_ALLOCATE_MAX_RATIO: process.env.NEXT_PUBLIC_PIGGY_BANK_ALLOCATE_MAX_RATIO,
	},
}

export default nextConfig
