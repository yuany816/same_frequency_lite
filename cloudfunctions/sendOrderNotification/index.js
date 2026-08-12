const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const requesterOpenid = cloud.getWXContext().OPENID
    const { relationshipId, orderTitle } = event || {}
    const result = await db.collection('relationships').where({ _id: relationshipId, memberOpenids: requesterOpenid, status: 'active' }).limit(1).get()
    const relationship = result.data[0]
    if (!relationship) throw new Error('无权发送订单通知')
    const recipientOpenid = relationship.memberOpenids.find((item) => item !== requesterOpenid)
    await cloud.openapi.subscribeMessage.send({
      touser: recipientOpenid,
      templateId: process.env.ORDER_TEMPLATE_ID,
      page: 'pages/order/index',
      data: { thing1: { value: orderTitle || '新的订单' }, thing2: { value: '请打开小程序查看订单详情' } }
    })
    return { code: 0, message: 'success', data: null }
  } catch (err) {
    console.error('[sendOrderNotification]', err)
    return { code: -1, message: err.message || '订单通知发送失败', data: null }
  }
}
