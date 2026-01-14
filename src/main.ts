/**
 * 应用入口文件
 * 注册 Pinia, Router 并配置全局样式
 * Requirements: 1.5, 1.6
 */
import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";
import "./style.css";

// 创建Vue应用实例
const app = createApp(App);

// 创建Pinia实例
const pinia = createPinia();

// 注册插件
app.use(pinia);
app.use(router);

// 挂载应用
app.mount("#app");
