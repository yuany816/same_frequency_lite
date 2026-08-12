const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const relationshipId = event && event.relationshipId
    if (!relationshipId) return { code: 0, message: 'success', data: null }
    const memberships = await db.collection('relationships').where({ _id: relationshipId, memberOpenids: openid, status: 'active' }).limit(1).get()
    if (!memberships.data.length) throw new Error('无权访问该情侣关系')
    const result = await db.collection('couple_states').where({ relationshipId }).limit(1).get()
    return { code: 0, message: 'success', data: result.data[0] ? result.data[0].snapshot : null }
  } catch (err) {
    console.error('[getCoupleState]', err)
    return { code: -1, message: err.message || '读取数据失败', data: null }
  }
}
