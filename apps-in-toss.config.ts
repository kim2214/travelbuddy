import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "travelbuddy",

  brand: {
    // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    primaryColor: "#FD9B3C",
  },

  permissions: [
    // 현재 위치로 여행지(국가)를 자동 감지하기 위한 위치 권한
    { name: "geolocation", access: "access" },
    // 여행 회화를 탭해서 복사하기 위한 클립보드 쓰기 권한 (setClipboardText)
    { name: "clipboard", access: "write" },
  ],

  webBundleDir: "dist",
});
