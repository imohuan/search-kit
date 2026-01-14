import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  // 主布局路由（包含 NavBar 和 TabBar）
  {
    path: "/",
    component: () => import("@/components/layout/MainLayout.vue"),
    children: [
      {
        path: "",
        redirect: "/search",
      },
      {
        path: "search",
        name: "search",
        component: () => import("@/modules/search/pages/SearchView.vue"),
        meta: {
          title: "搜索",
          keepAlive: true,
        },
      },
      {
        path: "library",
        name: "library",
        component: () => import("@/modules/library/pages/LibraryView.vue"),
        meta: {
          title: "文档库",
          keepAlive: true,
        },
      },
      {
        path: "extractor",
        name: "extractor",
        component: () => import("@/modules/extractor/pages/ExtractorView.vue"),
        meta: {
          title: "选字提取",
          keepAlive: true,
        },
      },
    ],
  },
  // 独立页面路由（不包含 NavBar 和 TabBar）
  {
    path: "/detail/:id",
    name: "detail",
    component: () => import("@/modules/detail/pages/DetailView.vue"),
    meta: {
      title: "文档详情",
      keepAlive: false,
    },
  },
];

const router = createRouter({
  // 使用 hash 模式，支持 file:// 协议直接访问
  history: createWebHashHistory(),
  routes,
});

export default router;
