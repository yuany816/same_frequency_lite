const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const { anniversaryId, relationshipId, title } = event || {}
    const result = await db.collection('relationships').where({ _id: relationshipId, status: 'active' }).limit(1).get()
    const relationship = result.data[0]
    if (!relationship) throw new Error('关系不存在')
    const templateId = process.env.ANNIVERSARY_TEMPLATE_ID
    await Promise.all(relationship.memberOpenids.map((openid) => cloud.openapi.subscribeMessage.send({
      touser: openid,
      templateId,
      page: 'pages/anniversary/index',
      data: { thing1: { value: title || '纪念日' }, thing2: { value: '还有 5 天，提前准备一份惊喜吧' } }
    })))
    await db.collection('anniversary_notifications').add({
      data: { anniversaryId, relationshipId, sentAt: db.serverDate(), createTime: db.serverDate() }
    })
    return { code: 0, message: 'success', data: null }
  } catch (err) {
    console.error('[sendAnniversaryReminder]', err)
    return { code: -1, message: err.message || '纪念日提醒发送失败', data: null }
  }
}
