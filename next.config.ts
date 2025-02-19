import type { NextConfig } from 'next'
import * as fs from 'fs'
import * as path from 'path'

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
}

export default nextConfig
