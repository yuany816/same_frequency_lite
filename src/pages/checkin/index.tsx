import React, { useEffect, useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppStore } from '../../store/useAppStore'
import { CHECK_IN_SUBSCRIBE_TEMPLATE_ID } from '../../config/notification'
import { callFunction } from '../../services/cloud'
import styles from './index.module.scss'

const CheckInPage: React.FC = () => {
  const { linked, partnerName, nickname, relationshipId, checkInRequest, requestCheckIn, shareLocation, declineCheckIn } = useAppStore()
  const [locationLoading, setLocationLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'requester' | 'recipient'>('requester')

  useEffect(() => {
    const pages = Taro.getCurrentPages()
    const current = pages[pages.length - 1] as { options?: { mode?: string } } | undefined
    if (current?.options?.mode === 'recipient') setViewMode('recipient')
  }, [])
  useEffect(() => {
    if (!linked) Taro.redirectTo({ url: '/pages/onboarding/index' })
  }, [linked])

  const sendRequest = async () => {
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      try {
        await Taro.requestSubscribeMessage({ tmplIds: [CHECK_IN_SUBSCRIBE_TEMPLATE_ID] })
      } catch {}
    }
    requestCheckIn()
    setViewMode('requester')
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      callFunction('sendCheckInNotification', { relationshipId, requesterName: nickname })
        .catch(() => Taro.showToast({ title: '请求已保存，但通知发送失败', icon: 'none' }))
    }
    Taro.showToast({ title: `已向${partnerName}提交请求`, icon: 'success' })
  }

  const allowLocation = async () => {
    setLocationLoading(true)
    try {
      if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
        const location = await Taro.getLocation({ type: 'gcj02' })
        shareLocation({ latitude: location.latitude, longitude: location.longitude })
      } else {
        shareLocation()
      }
      Taro.showToast({ title: '位置已共享', icon: 'success' })
    } catch {
      Taro.showToast({ title: '需要定位权限才能共享', icon: 'none' })
    } finally {
      setLocationLoading(false)
    }
  }

  if (!linked) return <View />

  const isPending = checkInRequest?.status === 'pending'
  const isShared = checkInRequest?.status === 'shared'
  const isRecipient = viewMode === 'recipient'

  return <View className={styles.page}>
    <View className={styles.hero}><View className={styles.heroIcon}>⌖</View><Text className={styles.kicker}>COUPLE CHECK-IN</Text><Text className={styles.title}>确认 TA 此刻在哪里</Text><Text className={styles.sub}>轻轻问一句，不打扰彼此的自由，也让关心有回应</Text></View>
    {isPending && isRecipient && <View className={styles.notice}><View className={styles.noticeDot}>!</View><View className={styles.noticeMain}><Text className={styles.noticeTitle}>{checkInRequest?.requesterName} 想知道你在哪里</Text><Text className={styles.noticeSub}>同意后只会共享当前定位，不会持续追踪</Text><View className={styles.noticeActions}><Button className={styles.allow} onClick={allowLocation} disabled={locationLoading}>{locationLoading ? '正在获取定位...' : '确认并发送定位'}</Button><Text className={styles.decline} onClick={() => { declineCheckIn(); Taro.showToast({ title: '已拒绝本次请求', icon: 'none' }) }}>暂不分享</Text></View></View></View>}
    {isPending && !isRecipient && <View className={styles.waitingCard}><View className={styles.loadingRing}>⌖</View><Text className={styles.waitingTitle}>等待 {partnerName} 发送定位</Text><Text className={styles.waitingSub}>请求已提交，TA 确认后会把当前位置发给你</Text><Text className={styles.waitingPrivacy}>定位只会共享一次，不会持续追踪</Text></View>}
    {isShared && <View className={styles.locationCard}><View className={styles.mapMock}><View className={styles.mapGrid} /><View className={styles.pin}>⌖</View></View><View className={styles.locationInfo}><Text className={styles.locationTitle}>{checkInRequest?.recipientName} 已共享位置</Text><Text className={styles.locationAddress}>{checkInRequest?.address}</Text><Text className={styles.locationTime}>更新时间：{checkInRequest?.sharedAt}</Text></View></View>}
    {!isPending && !isShared && <View className={styles.empty}><Text className={styles.emptyIcon}>♡</Text><Text className={styles.emptyTitle}>{checkInRequest?.status === 'declined' ? 'TA 暂时没有分享位置' : '还没有发起查岗'}</Text><Text className={styles.emptySub}>{checkInRequest?.status === 'declined' ? '尊重彼此的选择，晚些时候再问问吧' : '发起后，TA 会收到一条查岗提醒'}</Text></View>}
    {!isRecipient && <Button className={styles.primary} onClick={sendRequest} disabled={isPending}>{isPending ? '等待 TA 回复' : isShared ? '再次发起查岗' : '发起查岗'}</Button>}
    <Text className={styles.tip}>{isRecipient ? '你可以随时拒绝分享，系统不会持续获取你的定位' : '定位仅在对方主动同意后共享，双方都可以随时拒绝'}</Text>
  </View>
}

export default CheckInPage
