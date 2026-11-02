export const manifest = {
  screens: {
    scr_mx6mkl: { name: "Landing", route: "/", position: { "x": 160, "y": 1820 } },
    scr_tcn7pr: { name: "How it works", route: "/#how", position: { "x": 1560, "y": 1820 } },
    scr_4h23hz: { name: "Privacy", route: "/#privacy", position: { "x": 2960, "y": 1820 } },
    scr_h4ly41: { name: "Responsible use", route: "/#responsible", position: { "x": 4360, "y": 1820 } },
    scr_2ue0bp: { name: "Log in", route: "/login", position: { "x": 160, "y": 3800 } },
    scr_bout34: { name: "Sign up", route: "/signup", position: { "x": 1560, "y": 3800 } },
    scr_j9k392: { name: "Forgot password", route: "/forgot-password", position: { "x": 2960, "y": 3800 } },
    scr_tpxs2v: { name: "Reset password", route: "/reset-password", position: { "x": 4360, "y": 3800 } },
    scr_qz6n6t: { name: "New conversation", route: "/app", state: { "demo": true }, position: { "x": 160, "y": 5780 } },
    scr_ax9fe9: { name: "Conversation", route: "/app/c/demo-presentation", state: { "demo": true }, position: { "x": 1560, "y": 5780 } },
    scr_uyap29: { name: "Conversation with context", route: "/app/c/demo-presentation", state: { "demo": true, "contextOpen": true }, position: { "x": 2960, "y": 5780 } },
    scr_96iz6r: { name: "My Reflections", route: "/app/reflections", state: { "demo": true }, position: { "x": 160, "y": 7760 } },
    scr_fcwbgs: { name: "Settings · Profile", route: "/app/settings/profile", state: { "demo": true }, position: { "x": 160, "y": 9740 } },
    scr_iagnh9: { name: "Settings · Appearance", route: "/app/settings/appearance", state: { "demo": true }, position: { "x": 1560, "y": 9740 } },
    scr_tz7dzy: { name: "Settings · Privacy & data", route: "/app/settings/privacy", state: { "demo": true }, position: { "x": 2960, "y": 9740 } },
    scr_69f2j5: { name: "Settings · Account", route: "/app/settings/account", state: { "demo": true }, position: { "x": 4360, "y": 9740 } },
    scr_laauva: { name: "Session expired", route: "/session-expired", position: { "x": 0, "y": 0 }, isDefaultRow: true },
    scr_m7wtbe: { name: "Unauthorized", route: "/unauthorized", position: { "x": 1400, "y": 0 }, isDefaultRow: true },
    scr_h1zqk1: { name: "Not found", route: "/not-found", position: { "x": 2800, "y": 0 }, isDefaultRow: true }
  },
  sections: {
    sec_lznous: { name: "Landing & Info", x: 0, y: 1600, width: 5720, height: 1180 },
    sec_py5wgl: { name: "Authentication", x: 0, y: 3580, width: 5720, height: 1180 },
    sec_f1cyc9: { name: "Conversations", x: 0, y: 5560, width: 4320, height: 1180 },
    sec_2xhzem: { name: "Reflections", x: 0, y: 7540, width: 1520, height: 1180 },
    sec_cj6q26: { name: "Settings", x: 0, y: 9520, width: 5720, height: 1180 }
  },
  layers: [
  { kind: "screen", id: "scr_laauva" },
  { kind: "screen", id: "scr_m7wtbe" },
  { kind: "screen", id: "scr_h1zqk1" },
  { kind: "section", id: "sec_lznous", children: [
    { kind: "screen", id: "scr_mx6mkl" },
    { kind: "screen", id: "scr_tcn7pr" },
    { kind: "screen", id: "scr_4h23hz" },
    { kind: "screen", id: "scr_h4ly41" }]
  },
  { kind: "section", id: "sec_py5wgl", children: [
    { kind: "screen", id: "scr_2ue0bp" },
    { kind: "screen", id: "scr_bout34" },
    { kind: "screen", id: "scr_j9k392" },
    { kind: "screen", id: "scr_tpxs2v" }]
  },
  { kind: "section", id: "sec_f1cyc9", children: [
    { kind: "screen", id: "scr_qz6n6t" },
    { kind: "screen", id: "scr_ax9fe9" },
    { kind: "screen", id: "scr_uyap29" }]
  },
  { kind: "section", id: "sec_2xhzem", children: [
    { kind: "screen", id: "scr_96iz6r" }]
  },
  { kind: "section", id: "sec_cj6q26", children: [
    { kind: "screen", id: "scr_fcwbgs" },
    { kind: "screen", id: "scr_iagnh9" },
    { kind: "screen", id: "scr_tz7dzy" },
    { kind: "screen", id: "scr_69f2j5" }]
  }]

};