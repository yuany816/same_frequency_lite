import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import { callFunction, ensureCloudReady } from './services/cloud';
import { loadRemoteState, saveRemoteState } from './services/persistence';
import { serializeAppState, useAppStore } from './store/useAppStore';
// 全局样式
import './app.scss';

function App(props) {
  // 可以使用所有的 React Hooks
  useEffect(() => {
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      Taro.showLoading({ title: '微信登录中' });
      let ready = false;
      const unsubscribe = useAppStore.subscribe((state) => {
        if (ready) saveRemoteState(serializeAppState(state)).catch((error) => console.warn('[syncCoupleState]', error));
      });
      ensureCloudReady()
        .then(() => callFunction<{
          relationshipId?: string
          nickname?: string
          avatarUrl?: string
          role?: '男方' | '女方' | null
          authorized?: boolean
        }>('login'))
        .then((loginResult) => {
          const profile: Record<string, any> = {
            relationshipId: loginResult.relationshipId || '',
            authorized: Boolean(loginResult.authorized)
          }
          if (loginResult.nickname) profile.nickname = loginResult.nickname
          if (loginResult.avatarUrl) profile.avatarUrl = loginResult.avatarUrl
          if (loginResult.role) profile.role = loginResult.role
          useAppStore.getState().hydrate(profile)
          return loadRemoteState(loginResult.relationshipId).then((snapshot) => ({
            snapshot,
            profile
          }))
        })
        .then(({ snapshot, profile }) => {
          if (snapshot) {
            useAppStore.getState().hydrate({
              ...snapshot,
              // The user record is authoritative for profile authorization.
              nickname: profile.nickname || snapshot.nickname,
              avatarUrl: profile.avatarUrl || snapshot.avatarUrl,
              authorized: profile.authorized || snapshot.authorized
            })
          }
          ready = true;
          Taro.hideLoading();
        })
        .catch((error) => {
          console.warn('[loadCoupleState]', error);
          ready = true;
          Taro.hideLoading();
          Taro.showModal({
            title: '微信登录失败',
            content: '请确认当前体验版使用最新代码，并检查 CloudBase 云函数是否已部署。',
            showCancel: false
          });
        });
      return unsubscribe;
    }
  }, []);

  // 对应 onShow
  useDidShow(() => {});

  // 对应 onHide
  useDidHide(() => {});

  return props.children;
}

export default App;
