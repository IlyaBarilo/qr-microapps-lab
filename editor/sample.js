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

  var computerThinking = {
    id: 'computer-thinking',
    title: 'Как думает компьютер?',
    html: "<!doctype html><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\"><style>body{background:#111;color:#eee;text-align:center;font:18px monospace;translate:0 calc(50vh - 50%)}pre{width:13ch;margin:auto;text-align:left;font:4vh/1 monospace}button{width:min(90%,30em);height:42px;margin:4px;font:inherit}e{color:#fff}f{color:#fd4}</style><b>Как думает компьютер?<br>Угадай ИТ-понятие.<br>Не знаешь — угадай :)</b><pre id=p></pre><div id=a></div><script>R=String.raw,z=x=>x.replace(/[A-`]/g,y=>String.fromCharCode(y.charCodeAt()+1007)),N=\"ОXFQFE];СSFK;МARRIC;ПFQFMFNNA`;КONRSANSA;ПAQAMFSQ;УRLOCIF;ЦIKL;ФTNKWI`;АLDOQISM;ПQODQAMMA;СFS];База данных\".split`;`,Q=[R` o  o  o []^/|\\/|\\/|\\||^/ \\/ \\/ \\||^1 2  3 ->;1;0;2;6a9`,R`      +-----+^      |  3  |^   +--+-----+^   |  2  |^+--+-----+^|  1  |^+-----+;0;2;1;da6`,R`+---------+^| X = 5   |^+----+----+^     |^   X = 8;3;4;5;7a6`,R`     [?]^     / \\^    1   0^   /     \\^ [YES]  [NO];7;6;9;c65`,R`   +-----+^   |     |^   v     |^  [DO]---+^   |^   * x 4;8;6;7;b86`,R`3 -->+----+^     | x2 |^6 <--+----+^       |^     [OUT];8;10;9;6ad`,R` [o]---[o]^  | \\ / |^ [o]-*-[o]^      |^     [o];12;11;2;49b`,R`  _________^ /_________\\^ | ID  42  |^ | ID  73  |^ | ID  91  |^ |_________|^ ?> ID=73;11;10;12;8bc`];i=c=0;n=_=>{if(i>7)return p.innerText=\"  СЧЁТ \"+c+\"/8\",a.innerHTML=\"<button onclick=n(i=c=0)>ЕЩЁ РАЗ\";q=Q[i++].split`;`;p.style.color=\"#\"+q[4];p.innerHTML=q[0].replaceAll(\"^\",\"\\n\").replace(/[o*?]/g,x=>`<${y=x==\"o\"?\"e\":\"f\"}>${x}</${y}>`);a.innerHTML=i+\"/8<br>\"+q.slice(1,4).map((x,j)=>`<button onclick=g(${j})>${z(N[x])}`).join``};g=x=>n(c+=x==i%3);n()</script>",
    spec: {
      schemaVersion: '0.1', id: 'computer-thinking', title: 'Как думает компьютер?', type: 'quiz',
      qr: { encoding: 'base64', ecc: 'M' },
      technical: { singleHtmlFile: true, externalResources: false, networkRequests: false, requiredViewport: true },
      interface: { touchControls: true, noHorizontalScroll: true, noVerticalScroll: true, minTouchTargetPx: 42, minControlGapPx: 8, requireControlLabels: true }
    }
  };

  var tournamentBracket = {
    id: 'tournament-bracket',
    title: 'Турнирная сетка',
    html: "<!doctype html><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\"><style>body{background:#111;color:#eee;text-align:center;font:18px monospace;translate:0 calc(50vh - 50%)}pre{width:max-content;margin:auto;text-align:left;font:3.5vh/1 monospace;color:#6ad}button{width:90%;height:42px;margin:4px;font:inherit}r{color:#f55}f{color:#5d5}v{color:#fd4}</style><b>Турнирная сетка<br><f>*</f> победа, <r>x</r> поражение<br>[<v>?</v>]=вопрос</b><div id=z></div><pre id=p></pre><div id=a></div><script>R=String.raw,D=\"   ; --;--;\\\\^;/^; +;[?]^; -;^^\".split`;`,N=\"A;B;C;D;3;4;7;Финал;Полуфинал;Четвертьфинал\".split`;`,P=\"Кто прошёл?;Кто чемпион?;Соперник C?;Матчей всего?;Какой этап?;Кто проиграл?;Матчей чемпиону?\".split`;`,Q=[R`Abxcdaa f-gBbc-e;0;0;1;0;3`,R`Ah*da f-xdBb/a daaa +gChx\\a ea fceDbe;1;0;3;0;2`,R`Abda fc 1^Dbe^Bbda fc 2^Cbe;2;0;1;3;0`,R`Abda fcdBb/a daaa +c^Cb\\a ea fceDbe;3;1;5;4;6`,R`AbdBbeCbdDbeEbdFbeGbdHb/;4;2;7;8;9`,R`Abc-daa fc^Bb*ce;5;0;0;1;3`,R`8b> 4b> 2^aaaa|^aaaav^aaaa1^;6;0;4;5;6`,R`Abda f[КУБОК]^Bbe;4;2;9;8;7`];i=s=0;n=_=>{if(i>7)return z.innerText=\"\",p.innerText=\"СЧЁТ \"+s+\"/8\",a.innerHTML=\"<button onclick=n(i=s=0)>ЕЩЁ РАЗ\";q=Q[i++].split`;`;z.innerHTML=P[q[1]].replace(\"?\",\"<v>?</v>\");p.innerHTML=q[0].replace(/[a-i]/g,x=>D[x.charCodeAt()-97]).replaceAll(\"^\",\"\\n\").replace(/[x*?]/g,x=>`<${y=\"rfv\"[\"x*?\".indexOf(x)]}>${x}</${y}>`);a.innerHTML=i+\"/8<br>\"+q.slice(3,6).map((x,j)=>`<button onclick=g(${j})>${N[x]}`).join``};g=x=>n(s+=x==q[2]);n()</script>",
    spec: {
      schemaVersion: '0.1', id: 'tournament-bracket', title: 'Турнирная сетка', type: 'quiz',
      qr: { encoding: 'base64', ecc: 'M' },
      technical: { singleHtmlFile: true, externalResources: false, networkRequests: false, requiredViewport: true },
      interface: { touchControls: true, noHorizontalScroll: true, noVerticalScroll: true, minTouchTargetPx: 42, minControlGapPx: 8, requireControlLabels: true }
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

  var cyberReflex = {
    id: 'cyber-reflex',
    title: 'Киберрефлекс',
    html: `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>body{margin:0;color:#fff;font:700 18px system-ui;text-align:center;touch-action:none;user-select:none}main{height:100vh;display:grid;place-content:center;background:radial-gradient(#124,#001)}h1{font-size:10vw;margin:8px}#o{--p:0;position:relative;width:min(50vw,25vh);aspect-ratio:1;margin:auto;background:conic-gradient(#2ef var(--p),#124 0)}#o,button{border-radius:50%}.w button{background:#012}.f button{background:#af2;color:#012}.f button:after{content:'ЖМИ!'}#t{font-size:8vw;color:#2ef}button{position:absolute;inset:6px;border:0;background:#2ef;color:#fff;font:700 64px system-ui}</style><main id=m><b id=h>5 РАУНДОВ</b><h1>КИБЕР<br>РЕФЛЕКС</h1><div id=o><button id=b>СТАРТ</button></div><div id=t></div></main><script>var $d=3,r=0,s=0,a=[],q,T,k=9999,p=performance;m.onpointerdown=e=>s?x(s<2?-1:p.now()-T):e.target==b&&r==0&&(a=[],o.style='',b.innerText='',n());function n(){s=1;m.className='w';h.innerText=++r+'/5 РАУНД';t.innerText='ЖДИ';q=setTimeout(()=>{s=2;m.className='f';T=p.now();q=setInterval(()=>{t.innerText=z=p.now()-T|0;z>1e3-$d*100&&x(-1)},16)},1e3+Math.random()*2e3)}function x(v){clearTimeout(q);s=0;m.className='w';z=v<0;v=z?1e3-$d*100:v|0;a.push(v);o.style='--p:'+20*r+'%';t.innerHTML=z?'<font color=#f90>ШТРАФ</font>':v+' мс';setTimeout(r<5?n:y,z?999:1500)}function y(){let v=a.reduce((x,y)=>x+y)/5|0;k>v&&(k=v);r=0;m.className='';h.innerText='СРЕДНЕЕ '+v+' · РЕКОРД '+k+' мс';t.innerHTML=(v<250?'МОЛНИЯ':v<330?'ПРО':v<500?'ИГРОК':'РАЗМИНКА')+'<br>'+v+' мс';b.innerText='СНОВА'}</script>`,
    spec: {
      schemaVersion: '0.1', id: 'cyber-reflex', title: 'Киберрефлекс', type: 'game', difficulty: 3,
      qr: { encoding: 'base64', ecc: 'M' },
      technical: { singleHtmlFile: true, externalResources: false, networkRequests: false, requiredViewport: true },
      interface: { touchControls: true, noHorizontalScroll: true, noVerticalScroll: true }
    }
  };

  var cyberTrack3d = {
    id: 'cyber-track-3d',
    title: 'Кибертрасса 2.5D',
    html: `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body style=margin:0;overflow:hidden><canvas id=c style="display:block;touch-action:none"></canvas><script>var $d=3,x=c.getContext('2d'),f=x.fillRect.bind(x),l=x.lineTo.bind(x),m=x.moveTo.bind(x),b=x.beginPath.bind(x),F='fillStyle',C=['#f24','#fc0','#a3f'],A=[],L=1,S=0,Q=1,r=0,N=22+$d*2;onresize=z=_=>{c.width=W=innerWidth;c.height=H=innerHeight;Y=H/4;B=W*.48};z();R=_=>{A=[];L=1;S=Q=o=r=0};c.onpointerdown=e=>Q?Q>1&&o<E||R():L=e.clientX/W*3|0;T=t=>{d=Math.min(.04,(t-o)/1e3||0);o=t;v=.3+$d*.04;r+=!(Q%3)*d;if(!Q){for(i=A.length;i--;){a=A[i];a[1]-=d*v;a[0]==L&&a[1]<.06&&a[1]+d*v>=.06?(Q=2,E=o+1e3,a[1]=.06):a[1]<-.15&&(Q=++S==N?3:0,Q&&(E=o+1e3),A.splice(i,1))}(!A.length||A[A.length-1][1]<.7)&&A.push([Math.random()*3|0,1,Math.random()*3|0])}x[F]='#002';f(0,0,W,H);x[F]='#2ef';f(0,0,W*S/N,5);b();m(W/2,Y);l(W/2+B,H);l(W/2-B,H);x[F]='#114';x.fill();x.strokeStyle='#38f';b();for(i=-3;i<4;i+=2){m(W/2,Y);l(W/2+B*i/3,H)}for(i=9;i--;){p=((i+r*v*9)%9)/9;p*=p;m(W/2-B*p,Y+(H-Y)*p);l(W/2+B*p,Y+(H-Y)*p)}x.stroke();for(i=Q<3?A.length:0;i--;){a=A[i];p=1-a[1];p*=p;X=W/2+(a[0]-1)*B*p*2/3;V=B*p/4;G=Y+(H-Y)*p;q=a[2];x.strokeStyle=C[q];b();for(j=4;j--;)x.rect(X-V*j/3,G-V*j/(q+1)/3,V*j*2/3,V*j*2/(q+1)/3);x.stroke()}p=(H-55-Y)/(H-Y);X=W/2+(L-1)*B*p*2/3;b();m(X,H-96);l(X-28,H-35);l(X+28,H-35);x[F]='#2ef';x.fill();if(Q){x.textAlign='center';x.font='bold 22px sans-serif';x.fillText(Q==1?'КИБЕРТРАССА 2.5D':Q==3?'ФИНИШ!':'УДАР',W/2,H/2-15);x[F]='#fff';x.font='15px sans-serif';x.fillText(Q==1?'ТАП: ПОЛОСА':'ЕЩЁ РАЗ',W/2,H/2+20)}requestAnimationFrame(T)};T(o=0)</script>`,
    spec: {
      schemaVersion: '0.1', id: 'cyber-track-3d', title: 'Кибертрасса 2.5D', type: 'game', difficulty: 3,
      qr: { encoding: 'base64', ecc: 'M' },
      technical: { singleHtmlFile: true, externalResources: false, networkRequests: false, requiredViewport: true },
      interface: { touchControls: true, noHorizontalScroll: true, noVerticalScroll: true }
    }
  };

  var cyberMaze3d = {
    id: 'cyber-maze-3d',
    title: 'Киберлабиринт 2.5D',
    documentation: {
      title: 'Как играть в «Киберлабиринт 2.5D»',
      intro: [
        'Задача — от первого лица найти зелёный выход раньше, чем закончится время. Оставшееся время показано в левом верхнем углу.'
      ],
      sections: [
        {
          title: 'Управление',
          items: [
            'Левая треть экрана — повернуть камеру на 90° влево.',
            'Стрелка ↑ в центральной трети — сделать один шаг вперёд.',
            'Правая треть экрана — повернуть камеру на 90° вправо.'
          ]
        },
        {
          title: 'Сложность и время',
          paragraphs: ['Сложность меняет только запас времени. Размер и устройство лабиринта остаются одинаковыми.'],
          items: ['1 — 52 секунды', '2 — 49 секунд', '3 — 46 секунд', '4 — 43 секунды', '5 — 40 секунд']
        },
        {
          title: 'Карта',
          paragraphs: [
            'Поле состоит из 15 × 15 клеток. При каждом запуске случайно выбирается одна из четырёх точек старта; кратчайший путь от любой из них до выхода занимает ровно 28 шагов.',
            'Координаты указаны как (x, y) от левого верхнего угла: S1 (3, 3), S2 (13, 1), S3 (5, 13), S4 (9, 13), выход E (7, 7).'
          ],
          visualization: {
            type: 'grid-map',
            title: 'Киберлабиринт 15 × 15',
            caption: 'S1–S4 → E · кратчайший путь 28 шагов',
            wall: '1',
            rows: [
              '111111111111111',
              '100010001000001',
              '111010101010111',
              '101000101010001',
              '101111101111101',
              '101000001000101',
              '101011111010101',
              '100010021010101',
              '101110101010101',
              '100000100010001',
              '111111111111101',
              '101000100000001',
              '101010101111111',
              '100010000000001',
              '111111111111111'
            ],
            starts: [
              { label: 'S1', index: 48 },
              { label: 'S2', index: 28 },
              { label: 'S3', index: 200 },
              { label: 'S4', index: 204 }
            ],
            exit: { label: 'E', index: 112 }
          }
        },
        {
          title: 'Правила раунда',
          items: [
            'Попытка пройти сквозь стену показывает сообщение «СТЕНА» и блокирует управление на 600 мс.',
            'После входа в выход таймер останавливается, а на экране остаётся точное время прохождения.',
            'После финиша или завершения времени новый запуск блокируется на 1 секунду, чтобы случайное быстрое нажатие не перезапустило игру.'
          ]
        },
        {
          title: 'Техническая основа',
          paragraphs: [
            'Объёмный вид строится автономным Canvas-рейкастером без Three.js, сети и внешних файлов. Сама игра помещается в QR с коррекцией L; это описание хранится в редакторе и не увеличивает QR-код игры.'
          ]
        }
      ]
    },
    html: `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><canvas id=c style=position:fixed;inset:0;touch-action:none></canvas><script>var $d=3,x=c.getContext('2d'),F='fillStyle',M='111111111111111100010001000001111010101010111101000101010001101111101111101101000001000101101011111010101100010021010101101110101010101100000100010001111111111111101101000100000001101010101111111100010000000001111111111111111',Q=1,E=0,o=0,m=Math,P=[48,28,200,204];onresize=z=_=>{c.width=W=innerWidth;c.height=H=innerHeight};z();N=_=>{k=m.random()*4|0;n=P[k];X=I=n%15;Z=V=n/15|0;A=D=k&1?-1.57:1.57;Q=0;S=performance.now()};c.onpointerdown=e=>{e.preventDefault();t=performance.now();if(Q)return Q!=2&&t>=E&&N();if(e.clientX<W/3)A-=1.57;else if(e.clientX>W*2/3)A+=1.57;else{i=m.round(I+m.sin(A));j=m.round(V+m.cos(A));n=i+j*15;M[n]>1?(R=(t-S)/1e3,I=i,V=j,Q=3,E=t+1e3):M[n]>0?(Q=2,E=t+600):(I=i,V=j)}};L=t=>{g=m.min(.04,(t-o)/1e3||0);o=t;Q==1&&(S=t);Q==2&&t>=E&&(Q=0);T=m.max(0,55-3*$d-(Q==3?R:(t-S)/1e3));!Q&&!T&&(Q=4,E=t+1e3);X+=(I-X)*g*8;Z+=(V-Z)*g*8;D+=m.atan2(m.sin(A-D),m.cos(A-D))*g*4;Y=H/2+m.sin(t/60)*6*(m.abs(X-I)+m.abs(Z-V));x[F]='#034';x.fillRect(0,0,W,Y);x[F]='#111';x.fillRect(0,Y,W,H-Y);x[F]='#8cf';for(i=16;i--;)x.fillRect(i*73%W,i*47%Y,2,2);x[F]='#234';for(j=Y;j<H;j+=22)x.fillRect(0,j,W,1);for(i=0;i<W;i+=5){r=D+(i/W-.5)*1.1;a=m.sin(r);b=m.cos(r);for(d=.05;d<18;d+=.05){n=m.round(X+a*d)+m.round(Z+b*d)*15;if(M[n]>0)break}u=X+a*d;v=Z+b*d;p=m.abs(u-m.round(u))>m.abs(v-m.round(v));d*=m.cos(r-D);h=m.min(H,H/d);x[F]=M[n]>1?'#0f8':'hsl(210 70% '+(18+35/(1+d)+p*8)+'%)';x.fillRect(i,Y-h/2,6,h)}x[F]='#fff';x.fillRect(W/2-9,Y,18,2);x.fillRect(W/2,Y-9,2,18);x.font='bold 18px sans-serif';x.textAlign='left';x.fillText(T.toFixed(1),12,24);x.textAlign='center';x.fillText('↶  ↑  ↷',W/2,H-16);if(Q){x[F]='#001d';x.fillRect(W/2-125,H/2-45,250,90);x[F]='#fff';x.fillText(['','НАЙДИ ВЫХОД','СТЕНА','ВЫХОД НАЙДЕН','ВРЕМЯ'][Q],W/2,H/2);x.font='13px sans-serif';x.fillText(Q==1?'ЛЕВО · ↑ · ПРАВО':Q==3?R.toFixed(1)+' СЕКУНД':'ЕЩЁ',W/2,H/2+22)}requestAnimationFrame(L)};N();Q=1;L(0)</script>`,
    spec: {
      schemaVersion: '0.1', id: 'cyber-maze-3d', title: 'Киберлабиринт 2.5D', type: 'game', difficulty: 3,
      qr: { encoding: 'base64', ecc: 'L' },
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

  var items = [tinyQuiz, computerThinking, tournamentBracket, packetNetwork, brickBreaker, firewall, releaseRun, cyberReflex, cyberTrack3d, cyberMaze3d, careerCompass];
  return {
    defaultId: brickBreaker.id,
    items: items,
    html: tinyQuiz.html,
    spec: tinyQuiz.spec,
    getById: function (id) { return items.find(function (item) { return item.id === id; }) || tinyQuiz; }
  };
});
