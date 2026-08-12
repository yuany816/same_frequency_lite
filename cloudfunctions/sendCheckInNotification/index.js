const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const { relationshipId, requesterName } = event || {}
    const requesterOpenid = cloud.getWXContext().OPENID
    if (!relationshipId) throw new Error('relationshipId is required')
    const relationshipResult = await db.collection('relationships').where({ _id: relationshipId, memberOpenids: requesterOpenid, status: 'active' }).limit(1).get()
    const relationship = relationshipResult.data[0]
    if (!relationship) throw new Error('无权发起查岗')
    const recipientOpenid = relationship.memberOpenids.find((item) => item !== requesterOpenid)
    if (!recipientOpenid) throw new Error('未找到另一半')
    // Replace the template id and page path with the approved WeChat subscription message.
    await cloud.openapi.subscribeMessage.send({
      touser: recipientOpenid,
      templateId: process.env.CHECK_IN_TEMPLATE_ID,
      page: 'pages/checkin/index?mode=recipient',
      data: {
        thing1: { value: `${requesterName || '你的另一半'} 发起了查岗` },
        thing2: { value: '对方正在等待你确认是否共享当前定位' }
      }
    })
    return { code: 0, message: 'success', data: null }
  } catch (err) {
    console.error('[sendCheckInNotification]', err)
    return { code: -1, message: err.message || '通知发送失败', data: null }
  }
}
