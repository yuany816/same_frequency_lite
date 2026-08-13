const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const snapshot = event && event.snapshot ? event.snapshot : null
    const relationshipId = event && event.relationshipId
    if (!snapshot) throw new Error('snapshot is required')
    if (!relationshipId) throw new Error('relationshipId is required')
    if (snapshot.relationshipId && snapshot.relationshipId !== relationshipId) {
      throw new Error('关系数据不一致')
    }
    const memberships = await db.collection('relationships').where({ _id: relationshipId, memberOpenids: openid, status: 'active' }).limit(1).get()
    if (!memberships.data.length) throw new Error('无权修改该情侣关系')
    const existing = await db.collection('couple_states').where({ relationshipId }).limit(1).get()
    if (existing.data.length) {
      await db.collection('couple_states').doc(existing.data[0]._id).update({
        data: { snapshot, relationshipId, updateTime: db.serverDate() }
      })
    } else {
      await db.collection('couple_states').add({
        data: { snapshot, relationshipId, createTime: db.serverDate(), updateTime: db.serverDate() }
      })
    }
    return { code: 0, message: 'success', data: null }
  } catch (err) {
    console.error('[syncCoupleState]', err)
    return { code: -1, message: err.message || '保存数据失败', data: null }
  }
}
