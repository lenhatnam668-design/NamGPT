* { box-sizing: border-box; }
:root {
  --pink: #f5c9e9;
  --purple: #aa94ef;
  --ink: #59496f;
}
body {
  margin: 0;
  font-family: "Trebuchet MS", Arial, sans-serif;
  color: var(--ink);
  background: linear-gradient(135deg, #fff2fb, #f1e5ff, #e7e8ff);
  min-height: 100vh;
}
button, textarea { font: inherit; }
button { cursor: pointer; }
.hidden { display: none !important; }
.home {
  max-width: 920px;
  margin: auto;
  min-height: 100vh;
  padding: 35px 24px;
  text-align: center;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
}
.logo { font-size: 27px; font-weight: 900; color: #8067b5; }
.logo span { color: #e990ce; }
.home > .logo { position: absolute; top: 30px; left: max(25px, calc((100vw - 1100px)/2)); }
.mascot {
  margin-top: 35px;
  width: 140px; height: 140px;
  border-radius: 45% 45% 42% 42%;
  display: grid; place-items: center;
  font-size: 75px; color: white;
  background: linear-gradient(145deg, #f4bde3, #b6a2f6);
  box-shadow: 0 18px 45px #bca0e755;
  animation: float 3s ease-in-out infinite;
}
.tag { margin: 30px 0 0; font-size: 10px; letter-spacing: 3px; color: #a38bc9; font-weight: bold; }
h1 { font-size: clamp(35px, 6vw, 58px); line-height: 1.15; margin: 17px 0; letter-spacing: -1.8px; }
h1 span { color: #b07bd7; }
.intro { max-width: 520px; line-height: 1.8; color: #8f81a2; }
.primary, .send {
  border: 0; color: white;
  background: linear-gradient(110deg, #ee9dd1, #a18be9);
  box-shadow: 0 8px 24px #c4a1e755;
  font-weight: bold;
}
.primary { margin-top: 15px; border-radius: 15px; padding: 16px 23px; }
.features { display: flex; gap: 15px; margin-top: 42px; }
.features div {
  background: #ffffff9c; border: 1px solid white;
  border-radius: 16px; padding: 15px 23px; line-height: 2;
  font-size: 22px;
}
.features b { font-size: 12px; }
.chat-page { display: flex; min-height: 100vh; }
.sidebar {
  width: 250px; padding: 24px 16px;
  background: #ffffffa6; border-right: 1px solid white;
  display: flex; flex-direction: column; gap: 15px;
}
.sidebar h4 { font-size: 10px; letter-spacing: 1px; color: #a291b8; margin-top: 25px; }
.sidebar button, .secondary {
  border: 1px solid #eadcf7; background: #fff9;
  color: #8c75b4; border-radius: 10px; padding: 11px;
}
#history { display: flex; flex-direction: column; gap: 5px; }
#history button { text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#backHome { margin-top: auto; }
.chat { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 100vh; }
.chat header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 18px 24px; border-bottom: 1px solid #ffffffa8;
}
.chat header div { display: flex; flex-direction: column; gap: 4px; }
.chat header small { font-size: 11px; color: #a191b5; }
.messages {
  flex: 1; width: 100%; max-width: 850px;
  padding: 25px 20px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 16px;
}.welcome { text-align: center; margin: auto; padding: 15px 0; }
.welcome h2 { font-size: 30px; }
.welcome p { color: #9b8baa; }
.mascot.small { width: 70px; height: 70px; font-size: 38px; margin: auto; }
.suggest {
  margin: 8px 4px; padding: 11px;
  border: 1px solid white; background: #ffffffb8;
  color: #7e68a4; border-radius: 12px;
}
.message { max-width: 85%; padding: 14px 16px; border: 1px solid white; background: #ffffffd9; border-radius: 5px 17px 17px; line-height: 1.7; overflow-wrap: anywhere; }
.message.user { align-self: flex-end; background: #f2ddf5; border-radius: 17px 5px 17px 17px; }
.message img { display: block; max-width: 230px; border-radius: 10px; margin-bottom: 8px; }
.message mjx-container { max-width: 100%; overflow-x: auto; }
.message pre { white-space: pre-wrap; overflow-x: auto; }
#chatForm {
  width: calc(100% - 32px); max-width: 800px;
  margin: 0 auto; padding: 13px;
  border: 1px solid white; background: #ffffffc9;
  border-radius: 17px; box-shadow: 0 10px 30px #b59bd522;
}
#question { width: 100%; resize: vertical; border: 0; outline: 0; background: transparent; color: var(--ink); }
.tools { display: flex; align-items: center; gap: 12px; margin-top: 10px; }
.tool { font-size: 12px; border: 0; background: transparent; color: #947eb4; cursor: pointer; }
.spacer { flex: 1; }
.send { width: 36px; height: 36px; border-radius: 12px; font-size: 18px; }
.preview { width: 75px; height: 75px; object-fit: cover; margin-top: 10px; border-radius: 10px; }
.notice { text-align: center; font-size: 10px; color: #ad9fbb; padding: 0 10px 12px; }
@keyframes float { 50% { transform: translateY(-8px) rotate(3deg); } }
@media(max-width:700px) {
  .home { padding-top: 85px; }
  .features { gap: 7px; }
  .features div { padding: 12px 10px; font-size: 18px; }
  .features b { font-size: 10px; }
  .chat-page { flex-direction: column; }
  .sidebar { width: 100%; min-height: auto; border-right: 0; border-bottom: 1px solid white; }
  .sidebar h4, #history { display: none; }
  #backHome { margin-top: 0; }
  .chat { min-height: 75vh; }
  .messages { padding: 18px 12px; }
  .message { max-width: 94%; font-size: 13px; }
}
