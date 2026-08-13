-- 情侣微信小程序关系型数据库结构
-- 目标数据库：MySQL 8.0+
-- 说明：
-- 1. 金额字段统一使用整数分，避免浮点误差。
-- 2. openid 使用微信 OpenID，禁止由客户端直接写入其他用户的 openid。
-- 3. couple_states 用于兼容当前 MVP 快照同步，正式业务数据以独立表为准。

CREATE DATABASE IF NOT EXISTS same_frequency
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE same_frequency;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  openid VARCHAR(64) NOT NULL,
  nickname VARCHAR(64) NOT NULL DEFAULT '',
  avatar_url VARCHAR(1024) NOT NULL DEFAULT '',
  gender_role ENUM('男方', '女方') NULL,
  onboarding_status ENUM(
    'pending_role',
    'pending_relationship',
    'waiting_confirmation',
    'completed'
  ) NOT NULL DEFAULT 'pending_role',
  pending_invite_id BIGINT UNSIGNED NULL,
  status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  update_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_openid (openid),
  KEY idx_users_role (gender_role),
  KEY idx_users_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS relationships (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  status ENUM('active', 'dissolved') NOT NULL DEFAULT 'active',
  linked_at DATETIME(3) NULL,
  create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  dissolve_time DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_relationships_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS relationship_members (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  relationship_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('男方', '女方') NOT NULL,
  joined_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  left_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_relationship_member (relationship_id, user_id),
  UNIQUE KEY uk_active_user_relationship (user_id, relationship_id),
  KEY idx_relationship_members_user (user_id),
  CONSTRAINT fk_relationship_members_relationship
    FOREIGN KEY (relationship_id) REFERENCES relationships (id),
  CONSTRAINT fk_relationship_members_user
    FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS relationship_invites (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  token_hash CHAR(64) NOT NULL,
  inviter_user_id BIGINT UNSIGNED NOT NULL,
  inviter_role ENUM('男方', '女方') NOT NULL,
  inviter_name VARCHAR(64) NOT NULL DEFAULT '',
  status ENUM('pending', 'accepted', 'rejected', 'expired')
    NOT NULL DEFAULT 'pending',
  accepted_by_user_id BIGINT UNSIGNED NULL,
  accepted_at DATETIME(3) NULL,
  rejected_by_user_id BIGINT UNSIGNED NULL,
  rejected_at DATETIME(3) NULL,
  relationship_id BIGINT UNSIGNED NULL,
  create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expire_time DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_relationship_invites_token (token_hash),
  KEY idx_relationship_invites_status (status),
  KEY idx_relationship_invites_inviter (inviter_user_id, status),
  CONSTRAINT fk_invites_inviter
    FOREIGN KEY (inviter_user_id) REFERENCES users (id),
  CONSTRAINT fk_invites_accepted_by
    FOREIGN KEY (accepted_by_user_id) REFERENCES users (id),
  CONSTRAINT fk_invites_rejected_by
    FOREIGN KEY (rejected_by_user_id) REFERENCES users (id),
  CONSTRAINT fk_invites_relationship
    FOREIGN KEY (relationship_id) REFERENCES relationships (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS menus (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  relationship_id BIGINT UNSIGNED NOT NULL,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(128) NOT NULL,
  description VARCHAR(1000) NOT NULL DEFAULT '',
  cover_url VARCHAR(1024) NOT NULL DEFAULT '',
  status ENUM('draft', 'published', 'offline') NOT NULL DEFAULT 'draft',
  published_at DATETIME(3) NULL,
  create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  update_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_menus_relationship (relationship_id, status),
  KEY idx_menus_owner (owner_user_id, status),
  CONSTRAINT fk_menus_relationship
    FOREIGN KEY (relationship_id) REFERENCES relationships (id),
  CONSTRAINT fk_menus_owner
    FOREIGN KEY (owner_user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS menu_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  menu_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_menu_categories_menu (menu_id, status, sort_order),
  CONSTRAINT fk_menu_categories_menu
    FOREIGN KEY (menu_id) REFERENCES menus (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dishes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  menu_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(128) NOT NULL,
  image_urls JSON NULL,
  description VARCHAR(1000) NOT NULL DEFAULT '',
  specification JSON NULL,
  prep_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  tip_suggested_amount_cent INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('draft', 'published', 'offline') NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  update_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_dishes_menu (menu_id, status, sort_order),
  KEY idx_dishes_category (category_id, status, sort_order),
  CONSTRAINT fk_dishes_menu
    FOREIGN KEY (menu_id) REFERENCES menus (id),
  CONSTRAINT fk_dishes_category
    FOREIGN KEY (category_id) REFERENCES menu_categories (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS carts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  relationship_id BIGINT UNSIGNED NOT NULL,
  buyer_user_id BIGINT UNSIGNED NOT NULL,
  menu_id BIGINT UNSIGNED NULL,
  status ENUM('active', 'submitted', 'cleared') NOT NULL DEFAULT 'active',
  update_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_carts_active_buyer (relationship_id, buyer_user_id, status),
  KEY idx_carts_menu (menu_id),
  CONSTRAINT fk_carts_relationship
    FOREIGN KEY (relationship_id) REFERENCES relationships (id),
  CONSTRAINT fk_carts_buyer
    FOREIGN KEY (buyer_user_id) REFERENCES users (id),
  CONSTRAINT fk_carts_menu
    FOREIGN KEY (menu_id) REFERENCES menus (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cart_id BIGINT UNSIGNED NOT NULL,
  dish_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  update_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_cart_items_dish (cart_id, dish_id),
  CONSTRAINT fk_cart_items_cart
    FOREIGN KEY (cart_id) REFERENCES carts (id),
  CONSTRAINT fk_cart_items_dish
    FOREIGN KEY (dish_id) REFERENCES dishes (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no VARCHAR(32) NOT NULL,
  relationship_id BIGINT UNSIGNED NOT NULL,
  buyer_user_id BIGINT UNSIGNED NOT NULL,
  seller_user_id BIGINT UNSIGNED NOT NULL,
  menu_id BIGINT UNSIGNED NULL,
  status ENUM('创建', '食材购买中', '制作中', '验收', '已完成')
    NOT NULL DEFAULT '创建',
  items_snapshot JSON NOT NULL,
  buyer_remark VARCHAR(1000) NOT NULL DEFAULT '',
  tip_amount_cent INT UNSIGNED NOT NULL DEFAULT 0,
  tip_status ENUM('none', 'pending', 'paid', 'failed', 'refunded')
    NOT NULL DEFAULT 'none',
  total_dish_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  completed_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_orders_order_no (order_no),
  KEY idx_orders_relationship_status (relationship_id, status, created_at),
  KEY idx_orders_buyer_status (buyer_user_id, status),
  KEY idx_orders_seller_status (seller_user_id, status),
  CONSTRAINT fk_orders_relationship
    FOREIGN KEY (relationship_id) REFERENCES relationships (id),
  CONSTRAINT fk_orders_buyer
    FOREIGN KEY (buyer_user_id) REFERENCES users (id),
  CONSTRAINT fk_orders_seller
    FOREIGN KEY (seller_user_id) REFERENCES users (id),
  CONSTRAINT fk_orders_menu
    FOREIGN KEY (menu_id) REFERENCES menus (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_status_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  from_status VARCHAR(32) NULL,
  to_status VARCHAR(32) NOT NULL,
  operator_user_id BIGINT UNSIGNED NOT NULL,
  remark VARCHAR(1000) NOT NULL DEFAULT '',
  create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_order_status_logs_order (order_id, create_time),
  CONSTRAINT fk_order_status_logs_order
    FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT fk_order_status_logs_operator
    FOREIGN KEY (operator_user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tips (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  relationship_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  payer_user_id BIGINT UNSIGNED NOT NULL,
  receiver_user_id BIGINT UNSIGNED NOT NULL,
  amount_cent INT UNSIGNED NOT NULL,
  status ENUM('pending', 'paid', 'failed', 'refunded')
    NOT NULL DEFAULT 'pending',
  transaction_id VARCHAR(128) NULL,
  paid_at DATETIME(3) NULL,
  create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_tips_order_payer (order_id, payer_user_id),
  UNIQUE KEY uk_tips_transaction (transaction_id),
  KEY idx_tips_relationship (relationship_id, status),
  CONSTRAINT fk_tips_relationship
    FOREIGN KEY (relationship_id) REFERENCES relationships (id),
  CONSTRAINT fk_tips_order
    FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT fk_tips_payer
    FOREIGN KEY (payer_user_id) REFERENCES users (id),
  CONSTRAINT fk_tips_receiver
    FOREIGN KEY (receiver_user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS anniversaries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  relationship_id BIGINT UNSIGNED NOT NULL,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(128) NOT NULL,
  anniversary_date DATE NOT NULL,
  note VARCHAR(1000) NOT NULL DEFAULT '',
  reminder_days INT UNSIGNED NOT NULL DEFAULT 5,
  status ENUM('active', 'deleted') NOT NULL DEFAULT 'active',
  create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  update_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_anniversaries_relationship_date
    (relationship_id, status, anniversary_date),
  CONSTRAINT fk_anniversaries_relationship
    FOREIGN KEY (relationship_id) REFERENCES relationships (id),
  CONSTRAINT fk_anniversaries_creator
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS checkin_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  relationship_id BIGINT UNSIGNED NOT NULL,
  requester_user_id BIGINT UNSIGNED NOT NULL,
  recipient_user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending', 'shared', 'declined', 'expired')
    NOT NULL DEFAULT 'pending',
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  address VARCHAR(500) NULL,
  shared_at DATETIME(3) NULL,
  expire_time DATETIME(3) NULL,
  create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  update_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_checkin_relationship_status (relationship_id, status, create_time),
  KEY idx_checkin_recipient (recipient_user_id, status),
  CONSTRAINT fk_checkin_relationship
    FOREIGN KEY (relationship_id) REFERENCES relationships (id),
  CONSTRAINT fk_checkin_requester
    FOREIGN KEY (requester_user_id) REFERENCES users (id),
  CONSTRAINT fk_checkin_recipient
    FOREIGN KEY (recipient_user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS couple_interactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  relationship_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  interaction_type ENUM(
    'create_menu',
    'add_to_cart',
    'create_order',
    'accept_order',
    'tip_order',
    'create_anniversary',
    'checkin_request',
    'share_location'
  ) NOT NULL,
  score INT NOT NULL DEFAULT 0,
  reference_type VARCHAR(32) NULL,
  reference_id BIGINT UNSIGNED NULL,
  create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_interactions_relationship_time (relationship_id, create_time),
  KEY idx_interactions_user_time (user_id, create_time),
  CONSTRAINT fk_interactions_relationship
    FOREIGN KEY (relationship_id) REFERENCES relationships (id),
  CONSTRAINT fk_interactions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  relationship_id BIGINT UNSIGNED NULL,
  recipient_user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(128) NOT NULL,
  content VARCHAR(1000) NOT NULL DEFAULT '',
  reference_type VARCHAR(32) NULL,
  reference_id BIGINT UNSIGNED NULL,
  channel ENUM('in_app', 'wechat_subscribe') NOT NULL DEFAULT 'in_app',
  status ENUM('pending', 'sent', 'read', 'failed') NOT NULL DEFAULT 'pending',
  sent_at DATETIME(3) NULL,
  read_at DATETIME(3) NULL,
  create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_notifications_recipient (recipient_user_id, status, create_time),
  KEY idx_notifications_relationship (relationship_id, create_time),
  CONSTRAINT fk_notifications_relationship
    FOREIGN KEY (relationship_id) REFERENCES relationships (id),
  CONSTRAINT fk_notifications_recipient
    FOREIGN KEY (recipient_user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS anniversary_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  anniversary_id BIGINT UNSIGNED NOT NULL,
  relationship_id BIGINT UNSIGNED NOT NULL,
  sent_at DATETIME(3) NOT NULL,
  create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_anniversary_notifications (anniversary_id, relationship_id),
  CONSTRAINT fk_anniversary_notifications_anniversary
    FOREIGN KEY (anniversary_id) REFERENCES anniversaries (id),
  CONSTRAINT fk_anniversary_notifications_relationship
    FOREIGN KEY (relationship_id) REFERENCES relationships (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS couple_states (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  relationship_id BIGINT UNSIGNED NOT NULL,
  snapshot JSON NOT NULL,
  create_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  update_time DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_couple_states_relationship (relationship_id),
  CONSTRAINT fk_couple_states_relationship
    FOREIGN KEY (relationship_id) REFERENCES relationships (id)
) ENGINE=InnoDB;
