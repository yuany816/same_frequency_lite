import React, { useEffect, useState } from 'react'
import { Button, Image, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppStore } from '../../store/useAppStore'
import { callFunction } from '../../services/cloud'
import styles from './index.module.scss'

const Index: React.FC = () => {
  const { linked, onboardingStatus, partnerName, linkedAt, nickname, avatarUrl, authorized, setProfile } = useAppStore()
  const [authVisible, setAuthVisible] = useState(false)
  const [authStarted, setAuthStarted] = useState(false)
  const [draftName, setDraftName] = useState(nickname || '')
  const [draftAvatar, setDraftAvatar] = useState(avatarUrl || '')
  const [saving, setSaving] = useState(false)
  const daysTogether = linkedAt ? Math.max(1, Math.floor((Date.now() - new Date(linkedAt).getTime()) / 86400000) + 1) : 1

  useEffect(() => {
    if (onboardingStatus !== 'completed' || !linked) Taro.redirectTo({ url: '/pages/onboarding/index' })
  }, [linked, onboardingStatus])

  useEffect(() => {
    if (linked && !authorized) {
      setAuthVisible(true)
      setDraftName(nickname || '')
      setDraftAvatar(avatarUrl || '')
      if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
        callFunction('recordProfileAuthorization', {
          status: 'prompted',
          source: 'home_bottom_sheet'
        }).catch(() => {})
      }
    }
  }, [linked, authorized])

  const startAuthorization = async () => {
    setAuthStarted(true)
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      try {
        await callFunction('recordProfileAuthorization', {
          status: 'confirmed',
          source: 'home_bottom_sheet'
        })
      } catch {
        Taro.showToast({ title: '授权记录保存失败，请重试', icon: 'none' })
      }
    }
  }

  const handleAvatar = (event: any) => {
    const nextAvatar = event?.detail?.avatarUrl
    if (nextAvatar) setDraftAvatar(nextAvatar)
    else Taro.showToast({ title: '未获取到微信头像，请重试', icon: 'none' })
  }

  const saveAuthorization = async () => {
    if (!draftName.trim() || !draftAvatar) {
      Taro.showToast({ title: '请完成头像和昵称设置', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
        await callFunction('updateUserProfile', {
          nickname: draftName.trim(),
          avatarUrl: draftAvatar,
          authorizationSource: 'home_bottom_sheet'
        })
      }
      setProfile({ nickname: draftName.trim(), avatarUrl: draftAvatar })
      setAuthVisible(false)
      setAuthStarted(false)
      Taro.showToast({ title: '资料已更新', icon: 'success' })
    } catch (error: any) {
      if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
        callFunction('recordProfileAuthorization', {
          status: 'failed',
          source: 'home_bottom_sheet',
          errorCode: error?.message || 'update_profile_failed'
        }).catch(() => {})
      }
      Taro.showToast({ title: '资料保存失败，请重试', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const dismissAuthorization = () => {
    setAuthVisible(false)
    setAuthStarted(false)
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      callFunction('recordProfileAuthorization', {
        status: 'declined',
        source: 'home_bottom_sheet'
      }).catch(() => {})
    }
  }

  if (!linked) return <View />

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View>
          <Text className={styles.eyebrow}>OUR LITTLE KITCHEN</Text>
          <Text className={styles.title}>你好，{authorized && nickname ? nickname : '欢迎回来'}，今天想为 TA 做点什么？</Text>
        </View>
        {avatarUrl ? <Image className={styles.avatar} src={avatarUrl} mode='aspectFill' /> : <View className={styles.avatar}>{authorized && nickname ? nickname.slice(0, 1) : '我'}</View>}
      </View>

      <View className={styles.connection}>
        <View className={styles.heart}>♡</View>
        <View><Text className={styles.connectionLabel}>你和 {partnerName} 已经连在一起</Text><Text className={styles.connectionSub}>一起相伴的第 {daysTogether} 天</Text></View>
      </View>

      <Text className={styles.sectionTitle}>你们的生活</Text>
      <View className={styles.anniversaryFeature} onClick={() => Taro.navigateTo({ url: '/pages/cooking/index' })}><View className={styles.anniversaryIcon}>⌂</View><View><Text className={styles.anniversaryTitle}>给我做饭</Text><Text className={styles.anniversaryDesc}>把想吃的告诉 TA，也为 TA 做一顿饭</Text></View><Text className={styles.arrow}>›</Text></View>
      <View className={styles.anniversaryFeature} onClick={() => Taro.navigateTo({ url: '/pages/anniversary/index' })}><View className={styles.anniversaryIcon}>♡</View><View><Text className={styles.anniversaryTitle}>纪念日</Text><Text className={styles.anniversaryDesc}>把重要的日子记下来，提前准备惊喜</Text></View><Text className={styles.arrow}>›</Text></View>
      <View className={styles.anniversaryFeature} onClick={() => Taro.navigateTo({ url: '/pages/checkin/index' })}><View className={styles.anniversaryIcon}>⌖</View><View><Text className={styles.anniversaryTitle}>问问 TA 在哪里</Text><Text className={styles.anniversaryDesc}>TA 同意后，只共享一次当前定位</Text></View><Text className={styles.arrow}>›</Text></View>
      {!authorized && !authVisible && <View className={styles.authReminder} onClick={() => setAuthVisible(true)}><View><Text className={styles.authReminderTitle}>完善你的情侣资料</Text><Text className={styles.authReminderDesc}>授权后自动填充微信头像和昵称</Text></View><Text className={styles.authReminderAction}>去授权 ›</Text></View>}
      {authVisible && <View className={styles.authMask} onClick={dismissAuthorization}><View className={styles.authSheet} onClick={(event) => event.stopPropagation()}>
        <View className={styles.authSheetHead}><View><Text className={styles.authKicker}>PROFILE PERMISSION</Text><Text className={styles.authTitle}>完善你的情侣资料</Text></View><Text className={styles.authClose} onClick={dismissAuthorization}>×</Text></View>
        <Text className={styles.authCopy}>头像和昵称仅用于你们的情侣资料展示。点击同意后，将使用微信官方能力选择头像并填写昵称。</Text>
        <Text className={styles.authPrivacy}>我们不会在未经你确认的情况下获取或公开其他微信信息。</Text>
        {!authStarted && <Button className={styles.authPrimary} onClick={startAuthorization}>同意并授权</Button>}
        {authStarted && <View className={styles.authForm}>
          {Taro.getEnv() === Taro.ENV_TYPE.WEAPP ? <Button className={styles.avatarButton} openType='chooseAvatar' onChooseAvatar={handleAvatar}>{draftAvatar ? <Image className={styles.authAvatar} src={draftAvatar} mode='aspectFill' /> : <Text className={styles.authAvatarPlaceholder}>选择头像</Text>}</Button> : <View className={styles.avatarButton} onClick={() => setDraftAvatar(draftAvatar || 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=warm%20minimal%20portrait%20avatar%20for%20a%20friendly%20person%2C%20soft%20natural%20light%2C%20realistic%20photography&image_size=square')}><Text className={styles.authAvatarPlaceholder}>{draftAvatar ? '头像已选择' : '选择头像'}</Text></View>}
          <Input className={styles.authInput} type='nickname' maxlength={20} value={draftName} placeholder='点击填写微信昵称' onInput={(event) => setDraftName(event.detail.value)} />
          <Button className={styles.authPrimary} disabled={saving} onClick={saveAuthorization}>{saving ? '保存中...' : '保存资料'}</Button>
        </View>}
        {!authStarted && <Text className={styles.authLater} onClick={dismissAuthorization}>稍后再说</Text>}
      </View></View>}
    </View>
  )
}

export default Index
