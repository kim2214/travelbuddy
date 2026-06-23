import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "travelbuddy",
  brand: {
    displayName: "여행친구", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: "#FD9B3C", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [
    // 현재 위치로 여행지(국가)를 자동 감지하기 위한 위치 권한
    { name: "geolocation", access: "access" },
  ],
  outdir: "dist",
});
