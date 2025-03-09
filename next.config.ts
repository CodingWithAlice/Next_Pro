import type { NextConfig } from 'next'
import * as path from 'path'
import dotenv from 'dotenv'

// 构建正确的配置文件路径
const configPath = path.resolve(__dirname, './config.env')
dotenv.config({ path: configPath })


// 在构建和运行时使用
const nextConfig: NextConfig = {
	webpack: (config) => {
		
		return config
	},
	env: {
		DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
		CHECK_AUTH: process.env.CHECK_AUTH,
	},
}

export default nextConfig
