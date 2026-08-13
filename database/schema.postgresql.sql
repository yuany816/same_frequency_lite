-- 情侣微信小程序 PostgreSQL 数据库结构
-- PostgreSQL 12+
-- 请先连接目标数据库后执行本文件，不要执行 USE 或 CREATE DATABASE。

CREATE TYPE user_role AS ENUM ('男方', '女方');
CREATE TYPE user_status AS ENUM ('active', 'disabled');
CREATE TYPE relationship_status AS ENUM ('active', 'dissolved');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
CREATE TYPE menu_status AS ENUM ('draft', 'published', 'offline');
CREATE TYPE category_status AS ENUM ('active', 'disabled');
CREATE TYPE cart_status AS ENUM ('active', 'submitted', 'cleared');
CREATE TYPE order_status AS ENUM ('创建', '食材购买中', '制作中', '验收', '已完成');
CREATE TYPE tip_status AS ENUM ('none', 'pending', 'paid', 'failed', 'refunded');
CREATE TYPE anniversary_status AS ENUM ('active', 'deleted');
CREATE TYPE checkin_status AS ENUM ('pending', 'shared', 'declined', 'expired');
CREATE TYPE notification_channel AS ENUM ('in_app', 'wechat_subscribe');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'read', 'failed');

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  openid VARCHAR(64) NOT NULL UNIQUE,
  nickname VARCHAR(64) NOT NULL DEFAULT '',
  avatar_url VARCHAR(1024) NOT NULL DEFAULT '',
  gender_role user_role,
  authorized BOOLEAN NOT NULL DEFAULT FALSE,
  authorized_at TIMESTAMPTZ(3),
  onboarding_status VARCHAR(32) NOT NULL DEFAULT 'pending_role'
    CHECK (onboarding_status IN (
      'pending_role', 'pending_relationship',
      'waiting_confirmation', 'completed'
    )),
  pending_invite_id BIGINT,
  status user_status NOT NULL DEFAULT 'active',
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_authorizations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  action VARCHAR(64) NOT NULL DEFAULT 'profile_authorization',
  status VARCHAR(16) NOT NULL
    CHECK (status IN (
      'prompted', 'confirmed', 'authorized',
      'declined', 'cancelled', 'failed'
    )),
  source VARCHAR(32) NOT NULL DEFAULT 'home_bottom_sheet',
  avatar_url VARCHAR(1024),
  nickname_hash CHAR(64),
  prompted_at TIMESTAMPTZ(3),
  confirmed_at TIMESTAMPTZ(3),
  completed_at TIMESTAMPTZ(3),
  error_code VARCHAR(128),
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS relationships (
  id BIGSERIAL PRIMARY KEY,
  status relationship_status NOT NULL DEFAULT 'active',
  linked_at TIMESTAMPTZ(3),
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dissolve_time TIMESTAMPTZ(3)
);

CREATE TABLE IF NOT EXISTS relationship_members (
  id BIGSERIAL PRIMARY KEY,
  relationship_id BIGINT NOT NULL REFERENCES relationships(id),
  user_id BIGINT NOT NULL REFERENCES users(id),
  role user_role NOT NULL,
  joined_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMPTZ(3),
  UNIQUE (relationship_id, user_id)
);

CREATE TABLE IF NOT EXISTS relationship_invites (
  id BIGSERIAL PRIMARY KEY,
  token_hash CHAR(64) NOT NULL UNIQUE,
  inviter_user_id BIGINT NOT NULL REFERENCES users(id),
  inviter_role user_role NOT NULL,
  inviter_name VARCHAR(64) NOT NULL DEFAULT '',
  status invite_status NOT NULL DEFAULT 'pending',
  accepted_by_user_id BIGINT REFERENCES users(id),
  accepted_at TIMESTAMPTZ(3),
  rejected_by_user_id BIGINT REFERENCES users(id),
  rejected_at TIMESTAMPTZ(3),
  relationship_id BIGINT REFERENCES relationships(id),
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expire_time TIMESTAMPTZ(3)
);

CREATE TABLE IF NOT EXISTS menus (
  id BIGSERIAL PRIMARY KEY,
  relationship_id BIGINT NOT NULL REFERENCES relationships(id),
  owner_user_id BIGINT NOT NULL REFERENCES users(id),
  name VARCHAR(128) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cover_url VARCHAR(1024) NOT NULL DEFAULT '',
  status menu_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ(3),
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_categories (
  id BIGSERIAL PRIMARY KEY,
  menu_id BIGINT NOT NULL REFERENCES menus(id),
  name VARCHAR(64) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status category_status NOT NULL DEFAULT 'active',
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dishes (
  id BIGSERIAL PRIMARY KEY,
  menu_id BIGINT NOT NULL REFERENCES menus(id),
  category_id BIGINT NOT NULL REFERENCES menu_categories(id),
  name VARCHAR(128) NOT NULL,
  image_urls JSONB,
  description TEXT NOT NULL DEFAULT '',
  specification JSONB,
  prep_minutes INTEGER NOT NULL DEFAULT 0 CHECK (prep_minutes >= 0),
  tip_suggested_amount_cent INTEGER NOT NULL DEFAULT 0
    CHECK (tip_suggested_amount_cent >= 0),
  status menu_status NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carts (
  id BIGSERIAL PRIMARY KEY,
  relationship_id BIGINT NOT NULL REFERENCES relationships(id),
  buyer_user_id BIGINT NOT NULL REFERENCES users(id),
  menu_id BIGINT REFERENCES menus(id),
  status cart_status NOT NULL DEFAULT 'active',
  update_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_carts_active_buyer
  ON carts (relationship_id, buyer_user_id)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGSERIAL PRIMARY KEY,
  cart_id BIGINT NOT NULL REFERENCES carts(id),
  dish_id BIGINT NOT NULL REFERENCES dishes(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cart_id, dish_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_no VARCHAR(32) NOT NULL UNIQUE,
  relationship_id BIGINT NOT NULL REFERENCES relationships(id),
  buyer_user_id BIGINT NOT NULL REFERENCES users(id),
  seller_user_id BIGINT NOT NULL REFERENCES users(id),
  menu_id BIGINT REFERENCES menus(id),
  status order_status NOT NULL DEFAULT '创建',
  items_snapshot JSONB NOT NULL,
  buyer_remark TEXT NOT NULL DEFAULT '',
  tip_amount_cent INTEGER NOT NULL DEFAULT 0 CHECK (tip_amount_cent >= 0),
  tip_status tip_status NOT NULL DEFAULT 'none',
  total_dish_count INTEGER NOT NULL DEFAULT 0 CHECK (total_dish_count >= 0),
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ(3)
);

CREATE TABLE IF NOT EXISTS order_status_logs (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  from_status VARCHAR(32),
  to_status VARCHAR(32) NOT NULL,
  operator_user_id BIGINT NOT NULL REFERENCES users(id),
  remark TEXT NOT NULL DEFAULT '',
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tips (
  id BIGSERIAL PRIMARY KEY,
  relationship_id BIGINT NOT NULL REFERENCES relationships(id),
  order_id BIGINT NOT NULL REFERENCES orders(id),
  payer_user_id BIGINT NOT NULL REFERENCES users(id),
  receiver_user_id BIGINT NOT NULL REFERENCES users(id),
  amount_cent INTEGER NOT NULL CHECK (amount_cent > 0),
  status VARCHAR(16) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  transaction_id VARCHAR(128) UNIQUE,
  paid_at TIMESTAMPTZ(3),
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (order_id, payer_user_id)
);

CREATE TABLE IF NOT EXISTS anniversaries (
  id BIGSERIAL PRIMARY KEY,
  relationship_id BIGINT NOT NULL REFERENCES relationships(id),
  created_by_user_id BIGINT NOT NULL REFERENCES users(id),
  title VARCHAR(128) NOT NULL,
  anniversary_date DATE NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  reminder_days INTEGER NOT NULL DEFAULT 5 CHECK (reminder_days >= 0),
  status anniversary_status NOT NULL DEFAULT 'active',
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checkin_requests (
  id BIGSERIAL PRIMARY KEY,
  relationship_id BIGINT NOT NULL REFERENCES relationships(id),
  requester_user_id BIGINT NOT NULL REFERENCES users(id),
  recipient_user_id BIGINT NOT NULL REFERENCES users(id),
  status checkin_status NOT NULL DEFAULT 'pending',
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  address VARCHAR(500),
  shared_at TIMESTAMPTZ(3),
  expire_time TIMESTAMPTZ(3),
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS couple_interactions (
  id BIGSERIAL PRIMARY KEY,
  relationship_id BIGINT NOT NULL REFERENCES relationships(id),
  user_id BIGINT NOT NULL REFERENCES users(id),
  interaction_type VARCHAR(32) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  reference_type VARCHAR(32),
  reference_id BIGINT,
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  relationship_id BIGINT REFERENCES relationships(id),
  recipient_user_id BIGINT NOT NULL REFERENCES users(id),
  type VARCHAR(64) NOT NULL,
  title VARCHAR(128) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  reference_type VARCHAR(32),
  reference_id BIGINT,
  channel notification_channel NOT NULL DEFAULT 'in_app',
  status notification_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ(3),
  read_at TIMESTAMPTZ(3),
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS anniversary_notifications (
  id BIGSERIAL PRIMARY KEY,
  anniversary_id BIGINT NOT NULL REFERENCES anniversaries(id),
  relationship_id BIGINT NOT NULL REFERENCES relationships(id),
  sent_at TIMESTAMPTZ(3) NOT NULL,
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (anniversary_id, relationship_id)
);

CREATE TABLE IF NOT EXISTS couple_states (
  id BIGSERIAL PRIMARY KEY,
  relationship_id BIGINT NOT NULL UNIQUE REFERENCES relationships(id),
  snapshot JSONB NOT NULL,
  create_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_relationship_members_user
  ON relationship_members (user_id);
CREATE INDEX IF NOT EXISTS idx_user_authorizations_user
  ON user_authorizations (user_id);
CREATE INDEX IF NOT EXISTS idx_user_authorizations_user_time
  ON user_authorizations (user_id, create_time);
CREATE INDEX IF NOT EXISTS idx_user_authorizations_status
  ON user_authorizations (status);
CREATE INDEX IF NOT EXISTS idx_relationship_invites_status
  ON relationship_invites (status);
CREATE INDEX IF NOT EXISTS idx_relationship_invites_inviter
  ON relationship_invites (inviter_user_id, status);
CREATE INDEX IF NOT EXISTS idx_menus_relationship
  ON menus (relationship_id, status);
CREATE INDEX IF NOT EXISTS idx_menus_owner
  ON menus (owner_user_id, status);
CREATE INDEX IF NOT EXISTS idx_menu_categories_menu
  ON menu_categories (menu_id, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_dishes_menu
  ON dishes (menu_id, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_dishes_category
  ON dishes (category_id, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart
  ON cart_items (cart_id);
CREATE INDEX IF NOT EXISTS idx_orders_relationship
  ON orders (relationship_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_buyer
  ON orders (buyer_user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_seller
  ON orders (seller_user_id, status);
CREATE INDEX IF NOT EXISTS idx_order_status_logs_order
  ON order_status_logs (order_id, create_time);
CREATE INDEX IF NOT EXISTS idx_tips_relationship
  ON tips (relationship_id, status);
CREATE INDEX IF NOT EXISTS idx_anniversaries_relationship
  ON anniversaries (relationship_id, status, anniversary_date);
CREATE INDEX IF NOT EXISTS idx_checkin_relationship
  ON checkin_requests (relationship_id, status, create_time);
CREATE INDEX IF NOT EXISTS idx_checkin_recipient
  ON checkin_requests (recipient_user_id, status);
CREATE INDEX IF NOT EXISTS idx_interactions_relationship
  ON couple_interactions (relationship_id, create_time);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON notifications (recipient_user_id, status, create_time);
