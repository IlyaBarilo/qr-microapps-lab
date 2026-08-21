(function (root, factory) {
  var catalog = factory();
  if (typeof module === 'object' && module.exports) module.exports = catalog;
  else root.QRMicroappsSample = catalog;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var tinyQuiz = {
    id: 'tiny-quiz',
    title: 'ИТ-мини-тест',
    html: '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:18px;background:#071d2b;color:#effaff;font-family:system-ui}main{width:min(100%,400px);padding:22px;border-radius:22px;background:#0d3042}h1{margin:0 0 18px}button{width:100%;min-height:52px;margin-top:10px;border:0;border-radius:14px;background:#64e6d4;color:#04202a;font:700 17px system-ui;touch-action:manipulation}</style><main><h1>ИТ-мини-тест</h1><p id=q></p><div id=a></div><p id=s></p></main><script>Q=[[\'Что защищает аккаунт?\',\'Пароль\',\'Монитор\'],[\'Какой код выполняет браузер?\',\'JavaScript\',\'SQL\'],[\'Что проверяет брандмауэр?\',\'Трафик\',\'Яркость\']];n=k=0;function R(){if(n==3){q.textContent=\'Результат: \'+k+\' из 3\';a.innerHTML=\'<button onclick="n=k=0;R()">Пройти ещё раз</button>\';s.textContent=k==3?\'Отлично!\':\'Попробуй ещё\';return}q.textContent=Q[n][0];a.innerHTML=\'<button onclick="A(0)">\'+Q[n][1]+\'</button><button onclick="A(1)">\'+Q[n][2]+\'</button>\';s.textContent=\'Вопрос \'+(n+1)+\' из 3\'}function A(x){k+=!x;n++;R()}R()</script>',
    spec: {
      schemaVersion: '0.1', id: 'tiny-quiz', title: 'ИТ-мини-тест', type: 'quiz',
      qr: { encoding: 'base64', ecc: 'M' },
      technical: { singleHtmlFile: true, externalResources: false, networkRequests: false, requiredViewport: true },
      interface: { touchControls: true, noHorizontalScroll: true, noVerticalScroll: true, minTouchTargetPx: 44, minControlGapPx: 8, requireControlLabels: true }
    }
  };

  var packetNetwork = {
    id: 'packet-network',
    title: 'Пакет в сети',
    html: `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><body style=margin:0;overflow:hidden><canvas id=c style=display:block;touch-action:none;width:100vw;height:100vh></canvas><script>
var $d=3,D=devicePixelRatio||1,W=240,H=360,X=46,Q=0,M=1,S=[]
C=c.getContext('2d');f=C.fillRect.bind(C);z='fillStyle'
F=_=>{w=innerWidth;h=innerHeight;s=Math.min(w/W,h/360);H=h/s;O=(w-W*s)/2;c.width=w*D;c.height=h*D;C.setTransform(D*s,0,0,D*s,O*D,0)}
R=_=>{d=.4+$d/5;r=Math.sqrt(d);G=78/r;P=98/(d*.85+.15);U=1.34*r;B=U*P;J=3.2*r;A=.16*r;I=.045*r;Y=H/2;L=Y-G/2;V=T=K=0;S=[];Q=0}
N=_=>L=Math.max(30,Math.min(H-G-30,L+(Math.random()*2-1)*(E=B/(U+I)*J*($d*$d+9)/75)))
A0=_=>{if(M){M=0;S=[[W,N()]]}else Q>1?0:Q?R():V=-J}
F();R();onresize=F
c.ontouchstart=c.onmousedown=A0
setInterval(_=>{if(!Q&&!M){V+=A;Y+=V;T++;o=S[S.length-1];o[0]<W-B&&S.push([o[0]+B,N()]);p=0;for(i=0;i<S.length;i++){o=S[i];o[0]-=U;if(o[0]<X&&!o[2])K++,o[2]=p=1;if(X+10>o[0]&&X<o[0]+18&&(Y<o[1]||Y+10>o[1]+G))Q=64}p&&(U+=I);S=S.filter(o=>o[0]>-18)}if(!Q&&(Y<0||Y+10>H))Q=64;Q>1&&Q--;C[z]='#012';f(-O/s,0,w/s,H);C[z]='#123047';for(i=9;i--;)f(W-(i*41+T/4)%W,i*67%H,12,1);C[z]='#2fc';for(i=0;i<S.length;i++)f(S[i][0],0,18,S[i][1]),f(S[i][0],S[i][1]+G,18,H-S[i][1]-G);C[z]='#9ef';f(X,Y,10,10);C[z]='#fff';C.font='18px Arial';C.fillText(K,10,22);if(M||Q){C[z]='#071d2be8';f(38,H/2-45,164,90);C.textAlign='center';C.font='bold 20px Arial';C[z]='#fff';C.fillText(M?'ПАКЕТ В СЕТИ':'СЧЁТ: '+K,120,H/2-7);C.font='12px Arial';C[z]='#9ef';C.fillText(M?'КАСАНИЕ — ВЗЛЁТ':'КОСНИСЬ ЕЩЁ',120,H/2+19);C.textAlign='left'}},16)
</script>`,
    spec: {
      schemaVersion: '0.1', id: 'packet-network', title: 'Пакет в сети', type: 'game', difficulty: 3,
      qr: { encoding: 'base64', ecc: 'M' },
      technical: { singleHtmlFile: true, externalResources: false, networkRequests: false, requiredViewport: true },
      interface: { touchControls: true, noHorizontalScroll: true, noVerticalScroll: true }
    }
  };

  var brickBreaker = {
    id: 'brick-breaker',
    title: 'Разбей блоки',
    html: `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body style=margin:0;overflow:hidden><canvas id=c style=display:block;width:100vw;height:100vh;touch-action:none></canvas><script>
var $d=3,D=devicePixelRatio||1,W=240,B=7,C=c.getContext('2d'),f=C.fillRect.bind(C),s='fillStyle',o=0
F=_=>{w=innerWidth;h=innerHeight;S=Math.min(w/W,h/360);O=(w-W*S)/2;H=h/S;PY=H-75;c.width=w*D;c.height=h*D;C.setTransform(D*S,0,0,D*S,O*D,0)}
R=q=>{J=100-$d*10;X=120;Y=180;V=1.1+$d/6;U=-1.2-$d/4;P=(W-J)/2;K=0;A=-1;Q=q|0}
M=e=>{e.preventDefault();P=Math.max(0,Math.min(W-J,(e.clientX-O)/S-J/2))}
c.onpointerdown=e=>{Q&&R();M(e)};c.onpointermove=M;onresize=F;R(1);F()
L=t=>{g=Math.min(2,(t-o)/16.7||1);o=t;if(!Q){X+=V*g;Y+=U*g;if(X<B||X>W-B)V=-V,X=X<B?B:W-B;if(Y<B)U=Math.abs(U),Y=B;if(U>0&&Y+B>=PY&&Y-U*g+B<=PY&&X>P&&X<P+J)Y=PY-B,U=-Math.abs(U);for(i=0;i<32;i++)if(A>>i&1){Z=6+i%8*29;T=35+(i>>3)*16;if(X+B>Z&&X-B<Z+25&&Y+B>T&&Y-B<T+14){A^=1<<i;K++;U=-U;if(!A)Q=3;break}}if(Y-B>H)Q=2}C[s]='#06131c';f(-O/S,0,w/S,H);for(i=0;i<32;i++)if(A>>i&1)C[s]='hsl('+i*43+',80%,60%)',f(6+i%8*29,35+(i>>3)*16,25,14);C[s]='#183b4b';f(0,PY+20,W,H-PY-20);C[s]='#5de4cf';f(P,PY,J,10);C.beginPath();C.arc(X,Y,B,0,7);C[s]='#fff';C.fill();C.font='bold 16px Arial';C.textAlign='left';C.fillText(K,12,24);if(Q){C[s]='#0c202ddd';f(22,120,196,110);C.textAlign='center';C.font='bold 20px Arial';C[s]='#fff';C.fillText(Q==3?'ПОБЕДА':Q==1?'РАЗБЕЙ БЛОКИ':'СЧЕТ '+K,120,168);C.font='13px Arial';C[s]='#9ab4c0';C.fillText(Q==3?'ГОТОВО':Q==1?'ВЕДИ ПАЛЬЦЕМ':'ЕЩЕ РАЗ',120,196)}requestAnimationFrame(L)};L()
</script>`,
    spec: {
      schemaVersion: '0.1', id: 'brick-breaker', title: 'Разбей блоки', type: 'game', difficulty: 3,
      qr: { encoding: 'base64', ecc: 'M' },
      technical: { singleHtmlFile: true, externalResources: false, networkRequests: false, requiredViewport: true },
      interface: { touchControls: true, noHorizontalScroll: true, noVerticalScroll: true }
    }
  };

  var firewall = {
    id: 'firewall',
    title: 'Брандмауэр',
    html: `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body style=margin:0;overflow:hidden><canvas id=c style="display:block;touch-action:none"></canvas><script>var $d=3,v=.8+$d/12,f=(.33-$d*.02)*14/13,p=.3,n=Math.random;x=c.getContext('2d');A=[];d=0;m=1;q=k=l=0;onresize=z=_=>{c.width=W=innerWidth;c.height=H=innerHeight;Y=H-28};z();N=_=>{A=[];q=k=0;t=.2;u=v;j=1;l=0;m=0};E=_=>{q=1;l=.8};P=(X,V)=>{if(m)return N();if(q)return l<=0&&N();for(i=A.length;i--;)if(a=A[i],X>a[0]&&X<a[0]+a[4]&&V>a[1]&&V<a[1]+a[2])return a[3]?(k++,A.splice(i,1)):E()};c.onpointerdown=e=>P(e.clientX,e.clientY);setInterval(_=>{q&&l>0&&(l-=.016);if(!m&&!q){u+=v*.0003;j*=1.0004;t-=.016;d+=u/2;if(t<0){w=26.25+n()*6.25;y=w*(1+n()*3);X=n()*(W-w-12)+6;r=n()<p;for(i=A.length;i--;)if(r&&(a=A[i])[3]&&X<a[0]+a[4]+3&&X+w+3>a[0]&&-y-8<a[1]+a[2]+3&&-5>a[1]){r=0;break}A.push([X,-y-8,y,r,w]);t=f/j}for(i=A.length;i--;)a=A[i],a[1]+=u,a[3]&&a[1]+a[2]>Y?E():a[1]>H+a[2]&&A.splice(i,1)}x.fillStyle='#012';x.fillRect(0,0,W,H);x.fillStyle='#123';for(i=0;i<W;i+=50)x.fillRect(i,(i*7+d)%H,16,55);x.fillStyle='#7cf';x.fillRect(16,H-14,W-32,14);x.fillStyle='#fff';x.font='16px sans-serif';x.textAlign='left';x.fillText(k,8,18);if(!m&&!q)for(r=0;r<2;r++)for(i=A.length;i--;)a=A[i],a[3]==r&&(x.fillStyle=r?'#d44':'#2b6',x.fillRect(a[0],a[1],a[4],a[2]));if(m||q){x.fillStyle='#fffd';x.fillRect(W/2-96,H/2-44,192,102);x.fillStyle='#000';x.textAlign='center';['БРАНДМАУЭР','КРАСНЫЕ НАЖИМАЙ','ЗЕЛЕНЫЕ ПРОПУСКАЙ',q?'СЧЕТ '+k+'. ЕЩЕ РАЗ':'СТАРТ'].map((a,i)=>x.fillText(a,W/2,H/2-20+i*24))}},16)</script>`,
    spec: {
      schemaVersion: '0.1', id: 'firewall', title: 'Брандмауэр', type: 'game', difficulty: 3,
      qr: { encoding: 'base64', ecc: 'M' },
      technical: { singleHtmlFile: true, externalResources: false, networkRequests: false, requiredViewport: true },
      interface: { touchControls: true, noHorizontalScroll: true, noVerticalScroll: true }
    }
  };

  var releaseRun = {
    id: 'release-run',
    title: 'Успей в релиз',
    html: `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body style=margin:0;overflow:hidden><canvas id=c style=display:block;width:100vw;height:100vh;touch-action:none></canvas><script>\
var $d=3;x=c.getContext('2d');f=x.fillRect.bind(x);F='fillStyle';n=Math.random;A=[];M=-20;m=1;q=s=l=0;onresize=z=_=>{W=innerWidth;H=innerHeight;Y=H-24;D=devicePixelRatio||1;c.width=W*D;c.height=H*D;x.setTransform(D,0,0,D,0,0);y=Y-22};z();\
N=_=>{A=[];m=q=s=l=0;u=2.9+$d*.3;v=0;y=Y-22;t=36};P=_=>m?N():q?l<1&&N():y>Y-23?v=-10.5:0;c.onpointerdown=e=>e.preventDefault(P());\
setInterval(_=>{M=M>W+20?-20:M+.2;q&&l&&l--;if(!m&&!q){v+=.5;y+=v;y>Y-22&&(y=Y-22,v=0);if(--t<1){k=n()*3|0;h=[16,30,22][k];w=(k?18:22)*(n()*3+1|0);A.push([W+w,Y-h,w,h,k,0]);t=58-$d*4+n()*(32-$d*2);u+=.004+$d*.002}for(i=A.length;i--;){a=A[i];a[0]-=u;r=a[0]+a[2];if(!a[5]&&r<44)s++,a[5]=1;48<r&&58>a[0]&&y+20>a[1]&&(q=1,l=36);a[0]<-a[2]&&A.splice(i,1)}}\
x[F]='#124';f(0,0,W,H);x[F]='#789';for(i=18;i--;)f(i*79%W,i*53%(H*.45),2,2);x[F]='#fd7';x.beginPath();x.arc(M,50,11,0,7);x.fill();x[F]='#124';x.beginPath();x.arc(M+4,47,8,0,7);x.fill();x[F]='#333';f(0,Y,W,24);x[F]='#7cf';f(0,Y-4,W,4);x[F]='#fff';x.font='bold 18px sans-serif';x.textAlign='left';x.fillText(s,18,28);for(i=A.length;i--;){a=A[i];x[F]=a[4]==1?'#f80':a[4]==2?'#bbb':'#f45';f(a[0],a[1],a[2],a[3])}x[F]='#8ef';f(44,y,18,22);\
if(m||q){B=H/2;C=W/2;x[F]='#123e';f(C-86,B-44,172,88);x[F]='#7cf';x.textAlign='center';x.fillText('УСПЕЙ В РЕЛИЗ',C,B-14);x.font='15px sans-serif';x[F]='#fff';x.fillText(q?'СЧЕТ '+s:'ТАП-ПРЫЖОК',C,B+10);q&&l<1&&x.fillText('ЕЩЕ',C,B+32);m&&x.fillText('СТАРТ',C,B+32)}},16)</script>`,
    spec: {
      schemaVersion: '0.1', id: 'release-run', title: 'Успей в релиз', type: 'game', difficulty: 3,
      qr: { encoding: 'base64', ecc: 'M' },
      technical: { singleHtmlFile: true, externalResources: false, networkRequests: false, requiredViewport: true },
      interface: { touchControls: true, noHorizontalScroll: true, noVerticalScroll: true }
    }
  };

  var careerCompass = {
    id: 'career-compass',
    title: 'Карьерный компас ИТ',
    html: `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;padding:18px;background:#214;color:#fff;font:17px system-ui}main{width:min(100%,410px);margin:auto;padding:22px;border-radius:22px;background:#426}button{width:100%;height:52px;margin-top:10px;border:0;border-radius:14px;background:#fc6;font:bold 16px system-ui}</style><main><h1>Карьерный компас ИТ</h1><p id=q></p><div id=a></div><p id=s></p></main><script>Q=[['Что интереснее?','Разбираться в коде',0,'Объяснять людям',1],['Как удобнее работать?','Создавать интерфейсы',0,'Искать закономерности',2],['Что важнее в проекте?','Команда и общение',1,'Данные и точность',2]];O=[['Разработка','Создание программ и цифровых продуктов.'],['Управление продуктом','Работа с командой и потребностями пользователей.'],['Аналитика','Исследование данных и поиск закономерностей.']];n=0;v=[0,0,0];function R(){if(n==3){m=v.indexOf(Math.max(...v));q.innerHTML='<b>'+O[m][0]+'</b><br>'+O[m][1];a.innerHTML='<button onclick="n=0;v=[0,0,0];R()">Пройти ещё раз</button>';s.textContent='Рекомендация';return}q.textContent=Q[n][0];a.innerHTML='<button onclick="A(2)">'+Q[n][1]+'</button><button onclick="A(4)">'+Q[n][3]+'</button>';s.textContent='Вопрос '+(n+1)+' из 3'}function A(x){v[Q[n][x]]++;n++;R()}R()</script>`,
    spec: {
      schemaVersion: '0.1', id: 'career-compass', title: 'Карьерный компас ИТ', type: 'career-guidance',
      qr: { encoding: 'base64', ecc: 'M' },
      technical: { singleHtmlFile: true, externalResources: false, networkRequests: false, requiredViewport: true },
      interface: { touchControls: true, noHorizontalScroll: true, noVerticalScroll: true, minTouchTargetPx: 44, minControlGapPx: 8, requireControlLabels: true }
    }
  };

  var items = [tinyQuiz, packetNetwork, brickBreaker, firewall, releaseRun, careerCompass];
  return {
    defaultId: brickBreaker.id,
    items: items,
    html: tinyQuiz.html,
    spec: tinyQuiz.spec,
    getById: function (id) { return items.find(function (item) { return item.id === id; }) || tinyQuiz; }
  };
});
