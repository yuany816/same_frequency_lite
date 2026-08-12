export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/order/index',
    'pages/profile/index',
    'pages/cooking/index',
    'pages/menu/index',
    'pages/anniversary/index',
    'pages/checkin/index',
    'pages/heat/index',
    'pages/dish/index',
    'pages/order/detail',
    'pages/onboarding/index',
    'pages/invite/index',
    'pages/onboarding/success'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fffaf7',
    navigationBarTitleText: '两个人的厨房',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#a28e8a',
    selectedColor: '#e76f51',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/index/index', text: '情侣', iconPath: 'assets/tabbar/home.svg', selectedIconPath: 'assets/tabbar/home-selected.svg' },
      { pagePath: 'pages/heat/index', text: '情侣热度', iconPath: 'assets/tabbar/menu.svg', selectedIconPath: 'assets/tabbar/menu-selected.svg' },
      { pagePath: 'pages/profile/index', text: '我的', iconPath: 'assets/tabbar/profile.svg', selectedIconPath: 'assets/tabbar/profile-selected.svg' }
    ]
  }
})
