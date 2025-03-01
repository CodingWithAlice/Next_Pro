import type { NextConfig } from 'next'
import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'
const configPath = path.resolve(__dirname, '../config.env')
dotenv.config({ path: configPath })
console.log('🌹🌹🌹 configPath:', configPath);


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
		DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
		CHECK_AUTH: process.env.CHECK_AUTH,
	},
}
console.log('🌹🌹🌹next.config.ts:', nextConfig?.env?.PASSWORD);

export default nextConfig
