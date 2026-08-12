import React, { useEffect, useState } from 'react'
import { Button, Input, Picker, Text, Textarea, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppStore } from '../../store/useAppStore'
import styles from './index.module.scss'
import { ANNIVERSARY_SUBSCRIBE_TEMPLATE_ID } from '../../config/notification'

const today = new Date()
const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const AnniversaryPage: React.FC = () => {
  const { linked, anniversaries, addAnniversary, removeAnniversary } = useAppStore()
  const [formVisible, setFormVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!linked) Taro.redirectTo({ url: '/pages/onboarding/index' })
  }, [linked])

  if (!linked) return <View />

  const reset = () => {
    setFormVisible(false)
    setTitle('')
    setDate(defaultDate)
    setNote('')
  }

  const save = () => {
    if (!title.trim()) return Taro.showToast({ title: '请填写纪念日名称', icon: 'none' })
    const create = async () => {
      if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
        try {
          await Taro.requestSubscribeMessage({ tmplIds: [ANNIVERSARY_SUBSCRIBE_TEMPLATE_ID] })
        } catch {}
      }
      addAnniversary({ title: title.trim(), date, note: note.trim(), reminderDays: 5 })
      reset()
      Taro.showToast({ title: '纪念日已创建', icon: 'success' })
    }
    create()
  }

  return <View className={styles.page}>
    <View className={styles.head}><View><Text className={styles.kicker}>OUR SPECIAL DAYS</Text><Text className={styles.title}>纪念日</Text><Text className={styles.sub}>你们共同的日子，双方都能看见</Text></View><View className={styles.add} onClick={() => setFormVisible(true)}>＋</View></View>
    <View className={styles.notice}><Text className={styles.noticeIcon}>♡</Text><View><Text className={styles.noticeTitle}>提前 5 天提醒</Text><Text className={styles.noticeText}>纪念日前五天，我们会提醒你们准备惊喜</Text></View></View>
    <View className={styles.list}>{anniversaries.map((item) => <View className={styles.card} key={item.id}><View className={styles.dateBox}><Text className={styles.month}>{item.date.slice(5, 7)}月</Text><Text className={styles.day}>{item.date.slice(8, 10)}</Text></View><View className={styles.info}><Text className={styles.cardTitle}>{item.title}</Text><Text className={styles.cardDate}>{item.date.replace('-', '年').replace('-', '月')}日</Text>{item.note && <Text className={styles.note}>{item.note}</Text>}<Text className={styles.reminder}>双方可见 · 提前 {item.reminderDays} 天提醒</Text></View><Text className={styles.delete} onClick={() => Taro.showModal({ title: '删除纪念日', content: '删除后双方都将无法看到这个纪念日，确定删除吗？', confirmColor: '#e76f51' }).then(({ confirm }) => confirm && removeAnniversary(item.id))}>×</Text></View>)}</View>
    {!anniversaries.length && <View className={styles.empty}><Text className={styles.emptyIcon}>♡</Text><Text>还没有纪念日，创建一个共同的日子吧</Text></View>}
    {formVisible && <View className={styles.mask}><View className={styles.form}><View className={styles.formHead}><Text className={styles.formTitle}>创建纪念日</Text><Text className={styles.close} onClick={reset}>×</Text></View><Text className={styles.label}>纪念日名称</Text><Input className={styles.input} maxlength={30} placeholder='例如：第一次见面' value={title} onInput={(event) => setTitle(event.detail.value)} /><Text className={styles.label}>日期</Text><Picker mode='date' value={date} onChange={(event) => setDate(event.detail.value)}><View className={styles.datePicker}><Text>{date}</Text><Text className={styles.chevron}>›</Text></View></Picker><Text className={styles.label}>备注（选填）</Text><Textarea className={styles.textarea} maxlength={200} placeholder='写下你们想在这天做的事' value={note} onInput={(event) => setNote(event.detail.value)} /><View className={styles.reminderRow}><Text>微信提醒</Text><Text className={styles.reminderValue}>纪念日前 5 天</Text></View><Button className={styles.save} onClick={save}>保存纪念日</Button></View></View>}
  </View>
}

export default AnniversaryPage
