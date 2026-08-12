import Taro from '@tarojs/taro'
import { CLOUD_ENV_ID } from '../config/cloud'

const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
let cloudReady: Promise<void> | null = null

export function ensureCloudReady(): Promise<void> {
  if (!isWeapp) return Promise.resolve()
  if (!cloudReady) {
    cloudReady = (async () => {
      Taro.cloud.init({ env: CLOUD_ENV_ID, traceUser: true })
      await Taro.login()
    })().catch((error) => {
      cloudReady = null
      throw error
    })
  }
  return cloudReady
}

export async function callFunction<T = any>(
  name: string,
  data?: Record<string, any>
): Promise<T> {
  if (!isWeapp) {
    const mockModule = await import(`../data/${name}`)
    return mockModule.default(data) as T
  }
  try {
    await ensureCloudReady()
    const res = await Taro.cloud.callFunction({ name, data })
    const result = res.result as { code: number; message: string; data: T }
    if (result.code !== 0) {
      console.error(`[Cloud] ${name} failed:`, result.message)
      throw new Error(result.message || '请求失败')
    }
    return result.data
  } catch (error: any) {
    const message = error?.errMsg || error?.message || '云函数调用失败'
    console.error(`[Cloud] ${name} call failed:`, message)
    if (message.includes('501000')) {
      throw new Error('云函数调用失败，请确认体验版已上传最新代码且云函数已部署到当前 CloudBase 环境')
    }
    throw error
  }
}

export function getDatabase() {
  if (!isWeapp) {
    return null
  }
  return Taro.cloud.database()
}
