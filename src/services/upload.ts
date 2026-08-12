import Taro from '@tarojs/taro'
import { CLOUD_ENV_ID } from '../config/cloud'

export async function uploadImage(filePath: string, folder: string): Promise<string> {
  if (Taro.getEnv() !== Taro.ENV_TYPE.WEAPP) return filePath
  if (!CLOUD_ENV_ID) return filePath
  try {
    const result = await Taro.cloud.uploadFile({
      cloudPath: `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
      filePath
    })
    return result.fileID
  } catch (error) {
    console.warn('[uploadImage] cloud upload failed, use local preview', error)
    return filePath
  }
}
