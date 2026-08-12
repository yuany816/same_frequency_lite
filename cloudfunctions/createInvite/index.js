const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const role = event && event.role
    const inviterName = event && event.inviterName
    if (!role) throw new Error('role is required')
    const active = await db.collection('relationships').where({ memberOpenids: openid, status: 'active' }).limit(1).get()
    if (active.data.length) throw new Error('你已经有情侣关系')
    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    await db.collection('relationship_invites').add({
      data: { token, inviterOpenid: openid, inviterRole: role, inviterName: inviterName || '你的另一半', status: 'pending', createTime: db.serverDate() }
    })
    return { code: 0, message: 'success', data: { inviteId: token } }
  } catch (err) {
    console.error('[createInvite]', err)
    return { code: -1, message: err.message || '创建邀请失败', data: null }
  }
}
