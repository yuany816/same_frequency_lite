# CloudBase 数据库配置

本项目使用微信云开发 CloudBase 云数据库，不执行 MySQL/PostgreSQL 的建表 SQL。

环境 ID：

```text
ly-d5ghtbn5z02aaeab1
```

## 必须创建的集合

在微信开发者工具中打开“云开发 > 数据库”，创建以下集合：

```text
users
relationships
relationship_invites
couple_states
anniversary_notifications
user_authorizations
```

当前代码通过云函数真实读写这些集合：

| 集合 | 写入云函数 | 查询云函数 |
|---|---|---|
| `users` | `login`、`updateUserProfile` | `login` |
| `relationships` | `acceptInvite` | `login`、`getCoupleState`、`sendCheckInNotification`、`sendOrderNotification` |
| `relationship_invites` | `createInvite`、`acceptInvite`、`rejectInvite` | `getInviteStatus` |
| `couple_states` | `syncCoupleState` | `getCoupleState` |
| `anniversary_notifications` | `sendAnniversaryReminder` | 无 |
| `user_authorizations` | `recordProfileAuthorization`、`updateUserProfile` | 当前用户授权状态由 `login` 返回 |

## 推荐索引

在数据库控制台为以下字段建立索引：

```text
users:
  _openid

relationships:
  memberOpenids
  status

relationship_invites:
  token
  status
  inviterOpenid

couple_states:
  relationshipId

anniversary_notifications:
  anniversaryId
  relationshipId

user_authorizations:
  _openid
  status
  createTime
```

## 快照结构

MVP 阶段菜单、购物车、订单、纪念日、查岗和情侣热度统一存储在
`couple_states.snapshot` 中，结构对应前端 `PersistedAppState`：

```json
{
  "relationshipId": "关系记录_id",
  "dishes": [],
  "cart": {},
  "orders": [],
  "anniversaries": [],
  "checkInRequest": null,
  "heatScore": 60
}
```

后续业务量增大时，再将这些数组拆分为独立集合。

## 部署顺序

1. 微信开发者工具绑定 AppID `wx863d8daf55e206d8`。
2. 开通并选择 CloudBase 环境 `ly-d5ghtbn5z02aaeab1`。
3. 创建上面的 5 个集合和索引。
4. 右键 `cloudfunctions` 下的每个云函数，选择“上传并部署：云端安装依赖”。
5. 重新构建并上传 `dist` 小程序代码。
6. 使用两个真实微信账号验证登录、建联、菜单、订单和快照同步。

数据库权限建议：

- 关闭客户端直接读写权限。
- 统一通过云函数读写。
- 云函数必须使用 `cloud.getWXContext().OPENID` 校验当前用户。
