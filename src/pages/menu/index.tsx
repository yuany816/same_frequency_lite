import React, { useEffect, useState } from 'react'
import { Button, Image, Input, Text, Textarea, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppStore } from '../../store/useAppStore'
import styles from './index.module.scss'
import { uploadImage } from '../../services/upload'

const MenuPage: React.FC = () => {
  const { dishes, linked, role, addDish } = useAppStore()
  const myDishes = dishes.filter((dish) => dish.ownerRole === role)
  const [formVisible, setFormVisible] = useState(false)
  const [image, setImage] = useState('')
  const [name, setName] = useState('')
  const [prepMinutes, setPrepMinutes] = useState('30')
  const [ingredients, setIngredients] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!linked) Taro.redirectTo({ url: '/pages/onboarding/index' })
  }, [linked])

  if (!linked) return <View />

  const chooseDishImage = async () => {
    try {
      const result = await Taro.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'] })
      setImage(await uploadImage(result.tempFilePaths[0], 'dishes'))
      Taro.showToast({ title: '图片已添加', icon: 'success' })
    } catch {
      // 用户取消选择时保持当前表单
    }
  }

  const resetForm = () => {
    setFormVisible(false)
    setImage('')
    setName('')
    setPrepMinutes('30')
    setIngredients('')
    setDescription('')
  }

  const saveDish = () => {
    if (!image) return Taro.showToast({ title: '请上传菜品图片', icon: 'none' })
    if (!name.trim()) return Taro.showToast({ title: '请填写菜品名称', icon: 'none' })
    if (!ingredients.trim()) return Taro.showToast({ title: '请填写配料表', icon: 'none' })
    addDish({
      name: name.trim(),
      category: '家常菜',
      description: description.trim() || '这是一道想认真为 TA 做的菜。',
      ingredients: ingredients.trim(),
      image,
      prepMinutes: Math.max(1, Number(prepMinutes) || 30),
      tipSuggestedAmount: 6
    })
    resetForm()
    Taro.showToast({ title: '菜品已发布', icon: 'success' })
  }

  return <View className={styles.page}>
    <View className={styles.head}><View><Text className={styles.title}>我的菜单</Text><Text className={styles.sub}>把想做的，都留在这里</Text></View><View className={styles.add} onClick={() => setFormVisible(true)}>＋</View></View>
    <View className={styles.menuBanner}><View><Text className={styles.bannerTitle}>给小满的晚餐菜单</Text><Text className={styles.bannerSub}>{myDishes.length} 道菜 · 已发布</Text></View><Text className={styles.edit}>{role}菜单</Text></View>
    <Text className={styles.section}>菜品管理</Text>
    {myDishes.map((dish) => <View className={styles.dish} key={dish.id}><Image className={styles.image} src={dish.image} mode='aspectFill' /><View className={styles.dishMain}><Text className={styles.name}>{dish.name}</Text><Text className={styles.desc}>{dish.description}</Text><Text className={styles.ingredients}>配料：{dish.ingredients}</Text><View className={styles.meta}><Text>{dish.prepMinutes} 分钟</Text><Text className={styles.published}>仅对 TA 可见</Text></View></View></View>)}
    {!myDishes.length && <View className={styles.empty}><Text className={styles.emptyIcon}>＋</Text><Text>还没有你的菜，添加一道让 TA 看见吧</Text></View>}
    <View className={styles.addDish} onClick={() => setFormVisible(true)}><Text className={styles.plus}>＋</Text><Text>添加一道新菜</Text></View>
    {formVisible && <View className={styles.mask}><View className={styles.form}><View className={styles.formHead}><Text className={styles.formTitle}>添加一道新菜</Text><Text className={styles.close} onClick={resetForm}>×</Text></View><View className={styles.upload} onClick={chooseDishImage}>{image ? <Image className={styles.uploadImage} src={image} mode='aspectFill' /> : <><Text className={styles.uploadIcon}>＋</Text><Text className={styles.uploadText}>上传菜品图片</Text><Text className={styles.uploadHint}>支持相册或拍照</Text></>}</View><Text className={styles.label}>菜品名称</Text><Input className={styles.input} value={name} maxlength={30} placeholder='例如：番茄奶油意面' onInput={(event) => setName(event.detail.value)} /><Text className={styles.label}>制作时长（分钟）</Text><Input className={styles.input} type='number' value={prepMinutes} maxlength={3} onInput={(event) => setPrepMinutes(event.detail.value)} /><Text className={styles.label}>配料表</Text><Textarea className={styles.textarea} value={ingredients} maxlength={200} placeholder='例如：番茄、意面、淡奶油、罗勒' onInput={(event) => setIngredients(event.detail.value)} /><Text className={styles.label}>菜品描述（选填）</Text><Textarea className={styles.textarea} value={description} maxlength={200} placeholder='写一句让 TA 想吃的话' onInput={(event) => setDescription(event.detail.value)} /><Button className={styles.save} onClick={saveDish}>保存并发布</Button></View></View>}
  </View>
}

export default MenuPage
