/* GOOSE CLICKER: an idle honk empire that lives in the arcade lobby.
   Honks are the currency. Buy a flock, buy upgrades, hunt the secret ones,
   and watch the lobby fill up with geese as your honk total grows.
   Progress saves to localStorage (and keeps the old plain "honks" count). */
(()=>{'use strict';
const SAVE_KEY='goose-clicker-v1',OLD_KEY='honks';
const $=id=>document.getElementById(id);
const world=$('world'),btn=$('honk-counter'),countEl=$('honk-count'),rateEl=$('honk-rate'),farmBtn=$('farm-toggle');
const still=matchMedia('(prefers-reduced-motion:reduce)'),narrow=matchMedia('(max-width:700px)');
const rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- numbers */
const SHORT=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc','UDc','DDc','TDc'];
const LONG=['','thousand','million','billion','trillion','quadrillion','quintillion','sextillion','septillion','octillion','nonillion','decillion'];
function fmt(n,dp=0){if(!isFinite(n))return'∞';if(n<1e3)return dp&&n<100&&n%1?(+n.toFixed(dp)).toString():Math.floor(n).toLocaleString('en-US');if(n<1e6)return Math.floor(n).toLocaleString('en-US');const e=Math.min(Math.floor(Math.log10(n)/3),SHORT.length-1);return(+(n/10**(e*3)).toFixed(2))+SHORT[e]}
function fmtLong(n){if(n<1e6)return Math.round(n).toLocaleString('en-US');const e=Math.min(Math.floor(Math.log10(n)/3),LONG.length-1);return(+(n/10**(e*3)).toFixed(1))+' '+LONG[e]}
function fmtTime(s){s=Math.max(0,Math.floor(s));const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return d?`${d}d ${h}h`:h?`${h}h ${m}m`:m?`${m}m ${s%60}s`:`${s}s`}

/* ---------- 8x8 pixel icons */
const PAL={w:'#fff',g:'#bcb6c9',o:'#ff9a3c',k:'#151022',y:'#ffd84a',b:'#3d7bff',c:'#65f5ff',d:'#22356b',n:'#8a5a35',t:'#e0a85e',r:'#e04848',p:'#9a5cff',m:'#ff5cc8',s:'#7a7f99',G:'#4cc35a',a:'#c7a03a'};
const ICONS={
gosling:['........','....yy..','...ykyoo','....yy..','.yyyyy..','yyyyyyy.','.yyyyy..','..o..o..'],
pond:['....ww..','...wkwoo','....ww..','..wwww..','bbwwwwbb','bccbbccb','bbbbbbbb','.bbbbbb.'],
farm:['...rr...','..rrrr..','.rrrrrr.','rrwwwwrr','.rnnnnr.','.rnwwnr.','.rnwwnr.','GGGGGGGG'],
choir:['...yyyyy','...y...y','...y...y','...y...y','.yyy.yyy','yyyy.yyy','.yy...y.','........'],
bakery:['........','..tttt..','.tnttnt.','tttttttt','tnttnttt','tttttttt','.nnnnnn.','........'],
temple:['...yy...','..yyyy..','ssssssss','.w.w.w.w','.w.w.w.w','.w.w.w.w','ssssssss','........'],
mine:['.ssssss.','ssccssss','sssssccs','sccsssss','ssssccss','.ssssss.','...nn...','..nnnn..'],
portal:['..cccc..','.cbbbbc.','cbddddbc','cbdwwdbc','cbdwwdbc','cbddddbc','.cbbbbc.','..cccc..'],
timegoose:['yyyyyyyy','.wwwwww.','..wyyw..','...yy...','...yy...','..wwyw..','.wyyyyw.','yyyyyyyy'],
eternal:['.y.y.y..','.yyyyy..','..wwwoo.','..wkw...','..ww....','wwwwww..','wwwwwww.','.gggg...'],
honkularity:['..pppp..','.pkkkkp.','pkkkkkkp','pkkmmkkp','pkkmmkkp','pkkkkkkp','.pkkkkp.','..pppp..'],
click:['w.......','ww......','wkw.....','wkkw....','wkkkw...','wkkkkw..','wkkww...','ww.ww...'],
star:['...yy...','...yy...','yyyyyyyy','.yyyyyy.','..yyyy..','.yy..yy.','yy....yy','........'],
moon:['..yyy...','.yy.....','yy......','yy......','yy......','.yy.....','..yyy...','........'],
secret:['.pppppp.','pp....pp','......pp','....ppp.','...pp...','...pp...','........','...pp...'],
feather:['......yy','.....yyy','....yyy.','...yyy..','..yyy...','.yy.....','yy......','y.......'],
trophy:['yyyyyyyy','yyyyyyyy','.yyyyyy.','..yyyy..','...yy...','...yy...','..yyyy..','.nnnnnn.'],
lock:['..ssss..','.s....s.','.s....s.','ssssssss','sssyysss','sssyysss','ssssssss','........'],
bread:['........','..tttt..','.tnttnt.','tttttttt','tnttnttt','tttttttt','.nnnnnn.','........']};
const iconCache={};
function icon(name){if(name==='goose'||name==='gold')return`<svg viewBox="0 0 16 14" aria-hidden="true"><use href="#${name==='gold'?'goose-gold':'goose'}"/></svg>`;if(iconCache[name])return iconCache[name];let r='';(ICONS[name]||ICONS.secret).forEach((row,y)=>{for(let x=0;x<8;x++){const c=row[x];if(c&&c!=='.')r+=`<rect x="${x}" y="${y}" width="1" height="1" fill="${PAL[c]}"/>`}});return iconCache[name]=`<svg viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`}

/* ---------- the flock (producers) */
const B=[
{id:'gosling',name:'Gosling',pl:'Goslings',base:15,hps:.1,desc:'Small. Fluffy. Already furious.'},
{id:'pond',name:'Pond',pl:'Ponds',base:100,hps:1,desc:'A puddle with ambitions and a resident goose.'},
{id:'farm',name:'Goose Farm',pl:'Goose Farms',base:1100,hps:8,desc:'Free range. Free rage.'},
{id:'choir',name:'Honk Choir',pl:'Honk Choirs',base:12000,hps:47,desc:'Four-part harmony. All four parts are HONK.'},
{id:'bakery',name:'Bread Bakery',pl:'Bread Bakeries',base:130000,hps:260,desc:'Feeds the flock. The flock demands more.'},
{id:'temple',name:'Goose Temple',pl:'Goose Temples',base:1.4e6,hps:1400,desc:'Worship is mandatory. Snacks are not provided.'},
{id:'mine',name:'Asteroid Honk Mine',pl:'Asteroid Honk Mines',base:2e7,hps:7800,desc:'Ancient honks, dug out of asteroids. Andromedas crews hate this.'},
{id:'portal',name:'Honk Portal',pl:'Honk Portals',base:3.3e8,hps:44000,desc:'Opens onto a dimension made entirely of geese.'},
{id:'timegoose',name:'Time Goose',pl:'Time Geese',base:5.1e9,hps:260000,desc:'Honks yesterday so you have honks today.'},
{id:'eternal',name:'Eternal Goose Shrine',pl:'Eternal Goose Shrines',base:7.5e10,hps:1.6e6,desc:'The final boss of Siege of Legends, now on your payroll.'},
{id:'honkularity',name:'Honkularity',pl:'Honkularities',base:1e12,hps:1e7,desc:'All matter becomes goose. Resistance is honk.'}];
const BMAP=Object.fromEntries(B.map(b=>[b.id,b]));

/* ---------- state */
const fresh=()=>({v:1,honks:0,run:0,all:0,clicks:0,hand:0,b:{},u:[],a:[],found:[],golden:0,runners:0,feathers:0,migr:0,start:Date.now(),runStart:Date.now(),last:Date.now(),seen:1,amt:1,pets:0,duck:0,opened:0,eternals:0});
let S=fresh(),bought=new Set,ach=new Set,found=new Set,buffs=[],resetting=false,hadSave=false;
const has=id=>bought.has(id),own=id=>S.b[id]||0;
function load(){try{const raw=localStorage.getItem(SAVE_KEY);if(raw){S=Object.assign(fresh(),JSON.parse(raw));hadSave=true}else{const old=parseInt(localStorage.getItem(OLD_KEY),10)||0;if(old>0){S.honks=S.run=S.all=S.hand=S.clicks=old}}}catch(e){}
for(const k of['honks','run','all','clicks','hand'])if(!isFinite(S[k])||S[k]<0)S[k]=0;
bought=new Set(S.u);ach=new Set(S.a);found=new Set(S.found);if(S.all>=100)S.seen=Math.max(S.seen,Math.floor(Math.log10(S.all)))}
function serialize(){return{...S,u:[...bought],a:[...ach],found:[...found],last:Date.now()}}
function save(){if(resetting)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(serialize()));localStorage.setItem(OLD_KEY,String(Math.floor(S.all)))}catch(e){}}

/* ---------- upgrades */
const U=[];
const TIERS=[{at:1,x:10,n:'Sharper Beaks'},{at:5,x:50,n:'Louder Lungs'},{at:25,x:500,n:'Angrier Eyes'},{at:50,x:5e4,n:'Bread Futures'},{at:100,x:5e6,n:'Goose Union Contract'},{at:150,x:5e8,n:'Feather Fusion'},{at:200,x:5e10,n:'Honk of Theseus'}];
B.forEach(b=>TIERS.forEach((t,i)=>U.push({id:`${b.id}-${i}`,name:`${t.n}: ${b.pl}`,desc:`${b.pl} honk twice as hard.`,cost:b.base*t.x,icon:b.id,unlock:()=>own(b.id)>=t.at})));
const CLICKX2=['beak','brace','twohand','s-typed','s-frantic'];
U.push(
{id:'beak',name:'Reinforced Beak',desc:'Clicking honks twice as hard.',cost:100,icon:'click',unlock:()=>S.clicks>=15},
{id:'brace',name:'Carpal Honknel Brace',desc:'Clicking honks twice as hard.',cost:500,icon:'click',unlock:()=>S.clicks>=60},
{id:'twohand',name:'Two-Handed Honking',desc:'Clicking honks twice as hard.',cost:1e4,icon:'click',unlock:()=>S.clicks>=300});
const FINGERS=['Honk Finger','Honk Fist','Honk Elbow','Honk Shoulder','Full-Body Honk'];
FINGERS.forEach((n,i)=>U.push({id:'finger-'+i,name:n,desc:'Each click also honks 1% of your honks per second.',cost:5e4*100**i,icon:'click',unlock:()=>S.hand>=1e3*100**i}));
const GOS=[.1,.5,5];
['Gosling Daycare','Gosling Army','Gosling Galaxy'].forEach((n,i)=>U.push({id:'gos-'+i,name:n,desc:`Goslings and clicks gain +${GOS[i]} honks/s for every non-gosling building you own.`,cost:[1e5,1e7,1e9][i],icon:'gosling',unlock:()=>own('gosling')>=[25,50,100][i]}));
const GLOBALS={};
[['Premium Bread',.05,1e6],['Artisanal Bread',.05,1e7],['Sourdough of Destiny',.1,1e9],['Infinite Baguette',.1,1e11],['Bread Singularity',.2,1e13]].forEach(([n,p,c],i)=>{GLOBALS['bread-'+i]=p;U.push({id:'bread-'+i,name:n,desc:`The whole flock honks +${p*100}%.`,cost:c,icon:'bread',unlock:()=>S.all>=c/2})});
['I','II','III','IV','V'].forEach((r,i)=>U.push({id:'morale-'+i,name:'Flock Morale '+r,desc:'+1% honks per second for every trophy you have.',cost:9e5*100**i,icon:'trophy',unlock:()=>ach.size>=[10,25,40,60,80][i]}));
U.push(
{id:'lucky',name:'Lucky Feather',desc:'Golden geese show up twice as often.',cost:777777,icon:'gold',unlock:()=>S.golden>=3},
{id:'goldbread',name:'Golden Bread',desc:'Golden goose effects last twice as long.',cost:7.7e6,icon:'gold',unlock:()=>S.golden>=7},
{id:'radar',name:'Goose Radar',desc:'Golden geese fly slower and are easier to catch.',cost:7.7e8,icon:'gold',unlock:()=>S.golden>=27},
{id:'nightshift',name:'Goose Night Shift',desc:'Your flock keeps honking at 75% speed while you are away (up from 25%).',cost:5e5,icon:'moon',unlock:()=>S.all>=1e5});
/* secret upgrades: invisible until their secret is found somewhere in the lobby */
const SECRETS=[
{id:'konami',name:'Cheat Code Goose',desc:'+7% honks per second. Up up down down honk.',cost:77,g:.07,hint:'Old arcade legend: ↑ ↑ ↓ ↓ ← → ← → B A.'},
{id:'typed',name:'Literate Goose',desc:'Clicking honks twice as hard. It can spell its own name.',cost:200,hint:'A goose that can read? Try typing what it says.'},
{id:'duck',name:'Duck, Duck, GOOSE',desc:'Golden geese show up 25% more often.',cost:1000,hint:'Rumor: one of the ducks in this lobby is not a duck.'},
{id:'otis',name:'Good Boy Otis',desc:'+10% honks per second. Otis is a very good boy.',cost:2500,g:.1,hint:'Otis the dog would like some pets. Ten, specifically.'},
{id:'wrangler',name:'Goose Wrangler Hat',desc:'Clicking a running goose honks 7× harder.',cost:7777,hint:'The running geese are clickable. Catch 77 of them.'},
{id:'leet',name:'L33T H0NK',desc:'+13.37% honks per second.',cost:1337,g:.1337,hint:'Hackers report that exactly 1337 honks in the bank feels special.'},
{id:'night',name:'Night Owl Goose',desc:'+10% honks per second. Geese do not sleep either.',cost:3000,g:.1,hint:'Strange goose activity is reported between midnight and 4am.'},
{id:'quiz',name:'Noob or Scrub Diploma',desc:'+5% honks per second. Definitely scientific.',cost:500,g:.05,hint:'Finish the Noob or Scrub quiz. The geese are watching.'},
{id:'frantic',name:'Frantic Flapping',desc:'Clicking honks twice as hard.',cost:1500,hint:'Fifteen clicks in two seconds unlocks something.'},
{id:'patience',name:'Patience of a Goose',desc:'+15% honks per second.',cost:1e4,g:.15,hint:'Patient geese are rewarded. Touch nothing for ten minutes.'},
{id:'gamer',name:'Gamer Goose',desc:'+5% honks per second.',cost:1000,g:.05,hint:'The geese want you to actually play one of the games.'},
{id:'midas',name:'Golden Goose Egg',desc:'Lucky golden geese pay out twice as much.',cost:1e5,hint:'Catch a golden goose while a goose frenzy is already running.'}];
SECRETS.forEach(s=>{if(s.g)GLOBALS['s-'+s.id]=s.g;U.push({id:'s-'+s.id,name:s.name,desc:s.desc,cost:s.cost,icon:'secret',secret:true,unlock:()=>found.has(s.id)})});
const UMAP=Object.fromEntries(U.map(u=>[u.id,u]));

/* ---------- production math */
function goslingBonus(){let per=0;GOS.forEach((v,i)=>{if(has('gos-'+i))per+=v});if(!per)return 0;let n=0;B.forEach(b=>{if(b.id!=='gosling')n+=own(b.id)});return per*n}
function bldMult(b){let m=1;TIERS.forEach((t,i)=>{if(has(`${b.id}-${i}`))m*=2});return m}
function unitHps(b){return(b.hps+(b.id==='gosling'?goslingBonus():0))*bldMult(b)*globalMult()}
function globalMult(){let m=1+.02*S.feathers;for(const id in GLOBALS)if(has(id))m*=1+GLOBALS[id];for(let i=0;i<5;i++)if(has('morale-'+i))m*=1+.01*ach.size;return m}
function buffMult(kind){const now=Date.now();let m=1;buffs.forEach(b=>{if(b.kind===kind&&b.until>now)m*=b.mult});return m}
function baseHps(){let t=0;B.forEach(b=>{if(own(b.id))t+=unitHps(b)*own(b.id)});return t}
function hps(){return baseHps()*buffMult('prod')}
function clickPower(){let c=1;CLICKX2.forEach(id=>{if(has(id))c*=2});c+=goslingBonus();let f=0;for(let i=0;i<5;i++)if(has('finger-'+i))f++;c+=hps()*.01*f;return c*buffMult('click')}
function featherTarget(){return Math.floor(Math.cbrt(S.all/1e9))}
function costOf(b,n=S.amt){const r=1.15;return Math.ceil(b.base*r**own(b.id)*(r**n-1)/(r-1))}

/* ---------- trophies (achievements) */
const ACH=[];
[[1,'First Honk'],[100,'Honk Hundred'],[1e3,'Thousand Honk Salute'],[1e4,'Noise Complaint'],[1e5,'Neighborhood Watch'],[1e6,'Honk Millionaire'],[1e7,'City-Wide Alert'],[1e8,'Seismic Honk'],[1e9,'Honk Billionaire'],[1e10,'Continental Drift'],[1e11,'Heard From Space'],[1e12,'Honk Trillionaire'],[1e13,'Eternal Racket'],[1e15,'Heat Death of Silence']].forEach(([n,name])=>ACH.push({id:'t'+n,name,desc:`Honk ${fmtLong(n)} times in total.`,test:()=>S.all>=n}));
[[1,'Poke'],[100,'Clicky'],[1e3,'Tendonitis Speedrun'],[1e4,'Goose Button Mastery'],[5e4,'Your Mouse Has Filed A Complaint']].forEach(([n,name])=>ACH.push({id:'c'+n,name,desc:`Click the goose ${fmtLong(n)} times.`,test:()=>S.clicks>=n}));
B.forEach(b=>[[1,'Hatched'],[50,'Gaggle'],[100,'Mob'],[200,'Armada']].forEach(([n,w])=>ACH.push({id:`b-${b.id}-${n}`,name:`${b.name}: ${w}`,desc:`Own ${n} ${n===1?b.name:b.pl}.`,test:()=>own(b.id)>=n})));
[[1,'Shiny!'],[7,'Lucky Goose'],[27,'Golden Hoarder'],[77,'Midas Beak']].forEach(([n,name])=>ACH.push({id:'g'+n,name,desc:`Catch ${n} golden geese.`,test:()=>S.golden>=n}));
[[1,'Idle Hands'],[10,'Background Noise'],[100,'Constant Honking'],[1e3,'Honk Engine'],[1e4,'Honk Factory'],[1e5,'Honk Reactor'],[1e6,'Honk Star'],[1e8,'Honk Galaxy'],[1e10,'Honk Multiverse']].forEach(([n,name])=>ACH.push({id:'h'+n,name,desc:`Reach ${fmtLong(n)} honks per second.`,test:()=>hps()>=n}));
ACH.push({id:'wr50',name:'Goose Chaser',desc:'Click 50 running geese.',test:()=>S.runners>=50},
{id:'mig1',name:'Migrated South',desc:'Migrate South for the first time.',test:()=>S.migr>=1},
{id:'et1',name:'Blessed',desc:'Click the Eternal Goose when it rises.',test:()=>S.eternals>=1},
{id:'sec1',name:'Snoop',desc:'Find a secret.',test:()=>found.size>=1,secret:true},
{id:'sec6',name:'Goose Detective',desc:'Find 6 secrets.',test:()=>found.size>=6,secret:true},
{id:'secall',name:'Knows Every Secret',desc:'Find every secret in the lobby.',test:()=>found.size>=SECRETS.length,secret:true},
{id:'broke',name:'Broke Goose',desc:'Spend your bank down to under 1 honk after reaching 1,000 total.',test:()=>S.all>=1e3&&S.honks<1,secret:true});

/* ---------- sound */
let ac=null;
function audio(make){try{if(!ac&&!make)return null;ac??=new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac}catch(e){return null}}
function honkSound(pitch=1,vol=.14){const c=audio(true);if(!c)return;try{const o=c.createOscillator(),g=c.createGain(),now=c.currentTime;o.type='sawtooth';o.frequency.setValueAtTime(420*pitch,now);o.frequency.exponentialRampToValueAtTime(250*pitch,now+.25);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(vol,now+.02);g.gain.exponentialRampToValueAtTime(.0001,now+.3);o.connect(g);g.connect(c.destination);o.start(now);o.stop(now+.32)}catch(e){}}
function beep(f,d=.07,type='square',v=.04,delay=0,make=true){const c=audio(make);if(!c)return;try{const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+.02)}catch(e){}}
const fanfare=()=>[523,659,784,1047,784,1047].forEach((f,i)=>beep(f,.14,'square',.05,i*.1,false));
const chime=()=>[880,1175,1568].forEach((f,i)=>beep(f,.12,'triangle',.06,i*.07));

/* ---------- little effects */
function floatAt(x,y,text,cls=''){const e=document.createElement('div');e.className='gc-float '+cls;e.textContent=text;e.style.left=Math.min(Math.max(x+rand(-10,10),70),innerWidth-70)+'px';e.style.top=Math.max(y-10,30)+'px';document.body.appendChild(e);setTimeout(()=>e.remove(),1100)}
function bubble(x,y,text){const b=document.createElement('div');b.className='runner-honk';b.textContent=text;b.style.left=x+'%';b.style.top=y+'%';world.appendChild(b);setTimeout(()=>b.remove(),900)}
function bump(){btn.classList.remove('bump');void btn.offsetWidth;btn.classList.add('bump')}
const toastBox=document.createElement('div');toastBox.id='gc-toasts';toastBox.setAttribute('role','status');document.body.appendChild(toastBox);
function toast(title,body,ic='trophy',cls=''){const t=document.createElement('div');t.className='gc-toast '+cls;t.innerHTML=`<span class="gc-ic">${icon(ic)}</span><span><b>${esc(title)}</b>${esc(body)}</span>`;toastBox.appendChild(t);while(toastBox.children.length>4)toastBox.firstChild.remove();setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),400)},4800)}
function featherBurst(x,y,n=18){if(still.matches)return;for(let i=0;i<n;i++){const f=document.createElement('div');f.className='gc-feather';f.style.left=x+'px';f.style.top=y+'px';document.body.appendChild(f);const a=rand(0,Math.PI*2),d=rand(80,260);f.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d+120}px) rotate(${rand(-540,540)}deg)`,opacity:0}],{duration:rand(1100,1900),easing:'cubic-bezier(.2,.7,.4,1)'}).onfinish=()=>f.remove()}}

/* ---------- geese patrolling the lobby */
const PATHS={cliff:[[13.6,11.6],[33.4,18.4]],floor:[[30,98.6],[61,98.6]],cards:[[3,29.3],[97,29.3]]};
const H=2.45,geese=[];const maxGeese=()=>narrow.matches?16:30;
function pos(g){const t=g.rtl?1-g.p:g.p;return[g.a[0]+(g.b[0]-g.a[0])*t,g.a[1]+(g.b[1]-g.a[1])*t-H+g.lane]}
function spawn(){if(still.matches||geese.length>=maxGeese())return;const opts=['cliff','cliff'];if(tierOn('floor'))opts.push('floor','floor');if(tierOn('cards'))opts.push('cards');const[a,b]=PATHS[pick(opts)];const gold=tierOn('goldgeese')&&Math.random()<.15;
const el=document.createElement('button');el.className='runner'+(gold?' gold':'');el.type='button';el.tabIndex=-1;el.setAttribute('aria-hidden','true');el.innerHTML=`<svg><use href="#${gold?'goose-gold':'goose'}"/></svg>`;
const len=Math.hypot(b[0]-a[0],b[1]-a[1]);const g={el,a,b,rtl:Math.random()<.4,p:0,speed:rand(2.6,4.6)/len,lane:(Math.random()-.5)*1.2,phase:Math.random()*6,honk:rand(1,4),panic:0};
el.addEventListener('click',e=>{e.stopPropagation();g.panic=1.6;S.runners++;const v=clickPower()*(has('s-wrangler')?7:1)*(gold?13:1);gain(v,true);honkSound(1.25);floatAt(e.clientX,e.clientY,'+'+fmt(v,1),gold?'gold':'');const[x,y]=pos(g);bubble(x+.8,y-1,pick(['HONK!','HONK?!','HOOONK']));if(S.runners>=77)discover('wrangler')});
world.appendChild(el);geese.push(g)}
let lastFrame=performance.now();
function frame(now){const dt=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;
for(let i=geese.length-1;i>=0;i--){const g=geese[i];g.p+=g.speed*dt*(g.panic>0?2.6:1);g.panic-=dt;g.honk-=dt;g.phase+=dt*(g.panic>0?30:18);
if(g.p>=1){g.el.remove();geese.splice(i,1);continue}
const[x,y]=pos(g);g.el.style.left=x+'%';g.el.style.top=y+'%';g.el.style.transform=`translateY(${-Math.abs(Math.sin(g.phase))*18}%) rotate(${Math.sin(g.phase)*6}deg) scaleX(${g.rtl?-1:1})`;
if(g.honk<=0){g.honk=rand(2,6);if(Math.random()<.5)bubble(x+.8,y-1,pick(['HONK','honk','HONK!']))}}
requestAnimationFrame(frame)}
requestAnimationFrame(frame);

/* ---------- lobby evolution: visual tiers unlocked by all-time honks */
const VIS=[
{at:100,id:'floor',msg:'Geese now patrol the arcade floor.'},
{at:1e3,id:'cards',msg:'Geese have climbed on top of the game cabinets.'},
{at:1e4,id:'flocks',msg:'Flocks of geese now migrate across the sky.'},
{at:1e5,id:'snow',msg:'It is snowing feathers. Indoors. Somehow.'},
{at:1e6,id:'gold',msg:'Your honk button is now solid gold.'},
{at:1e7,id:'party',msg:'HONK PARTY: the lobby lights now pulse to the honk.'},
{at:1e8,id:'eternal',msg:'The Eternal Goose rises from the floor. Click it for a blessing.'},
{at:1e9,id:'trail',msg:'Your cursor now sheds golden feathers.'},
{at:1e10,id:'goldgeese',msg:'Some geese are now made of solid gold. Catch them.'}];
const tiers=new Set;const tierOn=id=>tiers.has(id);
const layer=document.createElement('div');layer.className='gc-layer';layer.setAttribute('aria-hidden','true');world.appendChild(layer);
function applyTiers(){VIS.forEach(v=>{if(S.all>=v.at&&!tiers.has(v.id)){tiers.add(v.id);document.body.classList.add('gt-'+v.id);if(v.id==='snow')startSnow()}})}
function startSnow(){if(still.matches)return;const snow=document.createElement('div');snow.className='gc-snow';for(let i=0;i<(narrow.matches?10:22);i++){const f=document.createElement('i');f.style.left=rand(0,100)+'%';f.style.animationDuration=rand(9,18)+'s, '+rand(2,4)+'s';f.style.animationDelay=-rand(0,18)+'s, '+-rand(0,4)+'s';snow.appendChild(f)}layer.appendChild(snow)}
function flock(){if(still.matches)return;const f=document.createElement('div');f.className='gc-flock';const n=5+Math.floor(Math.random()*5);let h='';for(let i=0;i<n;i++){const row=Math.ceil(i/2),side=i%2?1:-1;h+=`<svg style="left:${50-row*12}%;top:${50+side*row*14}%"><use href="#goose"/></svg>`}f.innerHTML=h;f.style.top=rand(2,16)+'%';const rtl=Math.random()<.5;if(rtl)f.classList.add('rtl');layer.appendChild(f);f.animate([{left:rtl?'104%':'-14%'},{left:rtl?'-14%':'104%'}],{duration:rand(14000,22000)}).onfinish=()=>f.remove()}
function party(){if(still.matches)return;world.classList.add('gc-party');for(let i=0;i<6;i++)setTimeout(()=>bubble(rand(10,90),rand(20,80),pick(['HONK','PARTY','HONK!','♫ HONK ♫'])),i*350);setTimeout(()=>world.classList.remove('gc-party'),2600)}
function eternalRise(){if(still.matches||layer.querySelector('.gc-eternal'))return;const e=document.createElement('button');e.className='gc-eternal';e.type='button';e.tabIndex=-1;e.innerHTML='<svg viewBox="0 -2 16 16" shape-rendering="crispEdges"><use href="#goose" x="0" y="0" width="16" height="14"/><g fill="#ffd84a"><rect x="10" y="0" width="4" height="1"/><rect x="10" y="-2" width="1" height="2"/><rect x="11.5" y="-1.5" width="1" height="1.5"/><rect x="13" y="-2" width="1" height="2"/></g><rect x="11.6" y=".15" width=".8" height=".7" fill="#e04848"/></svg>';e.style.left=rand(30,48)+'%';layer.appendChild(e);
const a=e.animate([{transform:'translateY(105%)'},{transform:'translateY(38%)',offset:.15},{transform:'translateY(42%)',offset:.5},{transform:'translateY(38%)',offset:.85},{transform:'translateY(105%)'}],{duration:7000,easing:'ease-in-out'});a.onfinish=()=>e.remove();setTimeout(()=>{if(e.isConnected){bubble(parseFloat(e.style.left)+11,62,'HONK.');honkSound(.45,.1)}},1200);
e.addEventListener('click',ev=>{ev.stopPropagation();if(e.dataset.used)return;e.dataset.used=1;S.eternals++;const v=hps()*60+clickPower()*25+777;gain(v);floatAt(ev.clientX,ev.clientY,'BLESSED +'+fmt(v),'gold big');featherBurst(ev.clientX,ev.clientY,24);chime();toast('THE ETERNAL GOOSE','Blessed you with '+fmt(v)+' honks.','eternal')})}
let trailT=0;document.addEventListener('pointermove',e=>{if(!tierOn('trail')||still.matches||e.pointerType!=='mouse')return;const n=performance.now();if(n-trailT<60)return;trailT=n;const f=document.createElement('div');f.className='gc-feather trail';f.style.left=e.clientX+'px';f.style.top=e.clientY+'px';document.body.appendChild(f);f.animate([{transform:'translate(0,0) rotate(0)',opacity:.9},{transform:`translate(${rand(-20,20)}px,40px) rotate(${rand(-180,180)}deg)`,opacity:0}],{duration:900}).onfinish=()=>f.remove()},{passive:true});

/* ---------- milestones */
const QUIPS=['The honk is eternal.','Somewhere, a goose sheds a single proud tear.','Scientists can no longer measure the honk.','The neighbors have moved out. All of them.','Reality is mostly honk now.','The geese have formed a government.'];
let bannerEl=null;
function milestone(e){const n=10**e,tier=VIS.find(v=>v.at===n);if(bannerEl)bannerEl.remove();const b=bannerEl=document.createElement('div');b.className='gc-banner';b.setAttribute('role','status');b.innerHTML=`<small>MILESTONE</small><b>${esc(fmtLong(n).toUpperCase())} HONKS!</b><span>${esc(tier?tier.msg:pick(QUIPS))}</span>`;document.body.appendChild(b);setTimeout(()=>{b.remove();if(bannerEl===b)bannerEl=null},4200);
fanfare();featherBurst(innerWidth/2,innerHeight*.38,30);if(!still.matches){world.classList.remove('gc-shake');void world.offsetWidth;world.classList.add('gc-shake');for(let i=0;i<10;i++)setTimeout(spawn,i*150)}}
function checkMilestone(){if(S.all<100)return;const e=Math.floor(Math.log10(S.all));if(e>S.seen){S.seen=e;applyTiers();milestone(e)}}

/* ---------- economy */
function gain(n,hand){if(!(n>0))return;S.honks+=n;S.run+=n;S.all+=n;if(hand)S.hand+=n;checkMilestone()}
let clickTimes=[],lastAction=Date.now();
function doClick(e){const v=clickPower();S.clicks++;gain(v,true);honkSound(.9+Math.random()*.25);bump();lastAction=Date.now();let x=e.clientX,y=e.clientY;if(!e.detail||(!x&&!y)){const r=e.currentTarget.getBoundingClientRect();x=r.left+r.width/2;y=r.top+r.height/2}floatAt(x,y,'+'+fmt(v,1),buffMult('click')>1?'gold':'');spawn();
const t=performance.now();clickTimes.push(t);clickTimes=clickTimes.filter(c=>t-c<2000);if(clickTimes.length>=15)discover('frantic');if(S.clicks===10||S.clicks===40)nudge();ui(true)}
btn.addEventListener('click',doClick);
function deny(el){beep(140,.12,'square',.04);el?.classList.remove('gc-deny');void el?.offsetWidth;el?.classList.add('gc-deny')}
function buyB(id,el){const b=BMAP[id],c=costOf(b);if(S.honks<c)return deny(el);S.honks-=c;S.b[id]=own(id)+S.amt;lastAction=Date.now();beep(660,.05,'square',.035);beep(990,.06,'square',.03,.05);honkSound(1.4,.06);for(let i=0;i<Math.min(3,S.amt);i++)setTimeout(spawn,i*200);renderStore(true)}
function buyU(id,el){const u=UMAP[id];if(!u||has(id))return;if(S.honks<u.cost)return deny(el);S.honks-=u.cost;bought.add(id);lastAction=Date.now();chime();if(u.secret)featherBurst(innerWidth/2,innerHeight/2,14);renderStore(true)}
function discover(id){if(found.has(id))return;found.add(id);const s=SECRETS.find(x=>x.id===id);toast('SECRET FOUND!',`"${s.name}" is now in the store.`,'secret','secret');[392,523,659,1047].forEach((f,i)=>beep(f,.1,'triangle',.05,i*.08));renderStore(true);save()}

/* ---------- golden geese */
let nextGolden=Date.now()+rand(70,150)*1000;
const goldenFreq=()=>(has('lucky')?2:1)*(has('s-duck')?1.25:1);
function spawnGolden(){const el=document.createElement('button');el.className='gc-golden';el.type='button';el.setAttribute('aria-label','A golden goose! Click it for a bonus.');el.innerHTML='<svg viewBox="0 0 16 14"><use href="#goose-gold"/></svg>';document.body.appendChild(el);
const y=rand(16,64);el.style.top=y+'vh';let anim=null;
if(still.matches){el.style.left=rand(10,80)+'vw';setTimeout(()=>el.remove(),12000)}else{const rtl=Math.random()<.5;if(rtl)el.classList.add('rtl');anim=el.animate([{left:rtl?'calc(100vw + 10px)':'-80px'},{left:rtl?'-80px':'calc(100vw + 10px)'}],{duration:(has('radar')?17:11)*1000});anim.onfinish=()=>el.remove()}
honkSound(1.8,.07);
el.addEventListener('click',e=>{anim?.cancel();el.remove();goldenEffect(e.clientX||innerWidth/2,e.clientY||innerHeight/2)})}
function goldenEffect(x,y){S.golden++;const frenzy=buffs.some(b=>b.kind==='prod'&&b.until>Date.now());if(frenzy)discover('midas');const dm=has('goldbread')?2:1,r=Math.random();chime();featherBurst(x,y,20);let msg;
if(r<.45){const v=Math.min(S.honks*.15,hps()*900)*(has('s-midas')?2:1)+13;gain(v);msg=['LUCKY!','+'+fmt(v)+' honks']}
else if(r<.8){buffs.push({kind:'prod',mult:7,until:Date.now()+77e3*dm,name:'GOOSE FRENZY ×7'});msg=['GOOSE FRENZY!','×7 honks per second for '+77*dm+'s']}
else if(r<.92){buffs.push({kind:'click',mult:777,until:Date.now()+13e3*dm,name:'HONK STORM ×777'});msg=['HONK STORM!','Clicks honk ×777 for '+13*dm+'s. CLICK!']}
else{const v=hps()*120+clickPower()*50+77;gain(v);for(let i=0;i<20;i++)setTimeout(spawn,i*90);msg=['GAGGLE!','A stampede of geese drops '+fmt(v)+' honks']}
floatAt(x,y,msg[0],'gold big');toast(msg[0],msg[1],'gold','gold');ui(true)}

/* ---------- HUD + panel */
const panel=document.createElement('div');panel.id='gc-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Goose Clicker');
panel.innerHTML=`<header><h2>GOOSE CLICKER</h2><button type="button" id="gc-close" aria-label="Close Goose Clicker">✕</button></header>
<div class="gc-top"><button type="button" id="gc-big" aria-label="Honk the goose"><svg viewBox="0 0 16 14"><use href="#goose"/></svg></button><div class="gc-bank"><div id="gc-honks">0</div><small>HONKS</small><div id="gc-hps">0 per second</div><div id="gc-click">0 per click</div></div></div>
<div id="gc-buffs"></div>
<nav class="gc-tabs" role="tablist"><button type="button" role="tab" data-tab="store" aria-selected="true">STORE</button><button type="button" role="tab" data-tab="trophies" aria-selected="false">TROPHIES</button><button type="button" role="tab" data-tab="stats" aria-selected="false">STATS</button><button type="button" role="tab" data-tab="options" aria-selected="false">MORE</button></nav>
<div class="gc-body">
<section data-pane="store"><h3><span>UPGRADES</span><span id="gc-secrets"></span></h3><div id="gc-upgrades"></div><h3><span>THE FLOCK</span><span class="gc-amt">BUY <button type="button" data-amt="1">1</button><button type="button" data-amt="10">10</button><button type="button" data-amt="100">100</button></span></h3><div id="gc-buildings"></div></section>
<section data-pane="trophies" hidden><div id="gc-trophies"></div></section>
<section data-pane="stats" hidden><dl id="gc-stats"></dl></section>
<section data-pane="options" hidden>
<h3><span>MIGRATE SOUTH</span></h3><p class="gc-note">Fly south for the winter. Your flock, upgrades and bank reset, but you earn <b>Golden Feathers</b>: +2% honks per second each, forever. Feathers come from your all-time honks (1 at a billion, 2 at 8 billion, 3 at 27 billion...).</p><p id="gc-mig-info" class="gc-note"></p><button type="button" class="gc-btn" id="gc-migrate">MIGRATE SOUTH</button>
<h3><span>SAVE</span></h3><p class="gc-note">Progress saves in this browser automatically. Copy the code to move it to another browser.</p><div class="gc-btns"><button type="button" class="gc-btn" id="gc-export">COPY SAVE CODE</button><button type="button" class="gc-btn" id="gc-import">LOAD SAVE CODE</button></div><textarea id="gc-save" rows="3" spellcheck="false" aria-label="Save code" placeholder="Paste a save code here, then press LOAD SAVE CODE"></textarea>
<h3><span>DANGER ZONE</span></h3><button type="button" class="gc-btn danger" id="gc-wipe">WIPE ALL HONKS</button></section>
</div><div id="gc-ticker" aria-live="off"><span></span></div>`;
document.body.appendChild(panel);
const P=s=>panel.querySelector(s);
function togglePanel(open=panel.hidden){panel.hidden=!open;farmBtn.setAttribute('aria-expanded',String(open));farmBtn.classList.remove('nudge');if(open){S.opened++;renderStore(true);ui(true);news()}}
farmBtn.addEventListener('click',()=>{beep(520,.05,'square',.03);togglePanel()});P('#gc-close').addEventListener('click',()=>togglePanel(false));
P('#gc-big').addEventListener('click',e=>{doClick(e);const big=P('#gc-big');big.classList.remove('squish');void big.offsetWidth;big.classList.add('squish')});
function nudge(){if(panel.hidden&&S.opened===0)farmBtn.classList.add('nudge')}
let tab='store';
panel.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
if(t.dataset.tab){tab=t.dataset.tab;panel.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===t)));panel.querySelectorAll('[data-pane]').forEach(p=>p.hidden=p.dataset.pane!==tab);P('.gc-body').scrollTop=0;renderPane();return}
if(t.dataset.b)return buyB(t.dataset.b,t);if(t.dataset.u)return buyU(t.dataset.u,t);
if(t.dataset.more){showAllUps=!showAllUps;renderStore(true);return}
if(t.dataset.amt){S.amt=+t.dataset.amt;renderStore(true);return}});
let confirmTimer={};
function twoStep(el,label,fn){if(el.dataset.armed){delete el.dataset.armed;el.textContent=label;fn();return}el.dataset.armed=1;el.textContent='REALLY? CLICK AGAIN';clearTimeout(confirmTimer[el.id]);confirmTimer[el.id]=setTimeout(()=>{delete el.dataset.armed;el.textContent=label},4000)}
P('#gc-migrate').addEventListener('click',e=>{const gainF=featherTarget()-S.feathers;if(gainF<1){deny(e.currentTarget);return}twoStep(e.currentTarget,'MIGRATE SOUTH',()=>{S.feathers+=gainF;S.migr++;S.honks=0;S.run=0;S.b={};bought.clear();buffs=[];S.runStart=Date.now();fanfare();featherBurst(innerWidth/2,innerHeight/2,40);toast('MIGRATED SOUTH','+'+gainF+' Golden Feathers. The flock starts over, stronger.','feather','gold');save();renderStore(true);renderPane()})});
P('#gc-export').addEventListener('click',async()=>{const code=btoa(JSON.stringify(serialize()));const ta=P('#gc-save');ta.value=code;ta.select();try{await navigator.clipboard.writeText(code);toast('SAVE COPIED','Paste it into another browser to keep honking.','feather')}catch(e){toast('SAVE CODE READY','Copy it from the box below.','feather')}});
P('#gc-import').addEventListener('click',e=>{try{const d=JSON.parse(atob(P('#gc-save').value.trim()));if(typeof d!=='object'||!d||!('honks' in d))throw 0;localStorage.setItem(SAVE_KEY,JSON.stringify(d));resetting=true;location.reload()}catch(err){deny(e.currentTarget);toast('THAT IS NOT A SAVE','The goose has inspected it and is offended.','lock')}});
P('#gc-wipe').addEventListener('click',e=>twoStep(e.currentTarget,'WIPE ALL HONKS',()=>{resetting=true;try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem(OLD_KEY)}catch(err){}location.reload()}));

let storeKey='',showAllUps=false;
function renderStore(force){if(panel.hidden)return;
const ups=U.filter(u=>!has(u.id)&&u.unlock()).sort((a,b)=>a.cost-b.cost);
let maxI=0;B.forEach((b,i)=>{if(own(b.id)||S.all>=b.base)maxI=i});const shown=B.slice(0,Math.min(B.length,maxI+2));
const key=ups.map(u=>u.id).join()+'|'+shown.length+'|'+S.amt;
if(force||key!==storeKey){storeKey=key;
const vis=showAllUps?ups:ups.slice(0,4);P('#gc-upgrades').innerHTML=!ups.length?'<p class="gc-note">No upgrades right now. Keep honking.</p>':vis.map(u=>`<button type="button" class="gc-row${u.secret?' secret':''}" data-u="${u.id}"><span class="gc-ic">${icon(u.icon)}</span><span class="gc-bn"><b>${esc(u.name)}${u.secret?' <i>SECRET</i>':''}</b><em>${esc(u.desc)}</em></span><span class="gc-cost" data-cost="${u.cost}">${fmt(u.cost)}</span></button>`).join('')+(ups.length>4?`<button type="button" class="gc-more" data-more="1">${showAllUps?'SHOW FEWER ▴':'SHOW ALL '+ups.length+' UPGRADES ▾'}</button>`:'');
P('#gc-buildings').innerHTML=shown.map((b,i)=>{const locked=!own(b.id)&&S.all<b.base&&i===shown.length-1&&i>0;return`<button type="button" class="gc-row bld${locked?' locked':''}" data-b="${b.id}"><span class="gc-ic">${icon(locked?'lock':b.id)}</span><span class="gc-bn"><b>${locked?'???':esc(b.name)}</b><span class="gc-cost"></span><em>${locked?'Keep honking to reveal.':esc(b.desc)}</em><em class="gc-each"></em></span><span class="gc-own"></span></button>`}).join('');
panel.querySelectorAll('[data-amt]').forEach(x=>x.classList.toggle('on',+x.dataset.amt===S.amt))}
const sc=SECRETS.length;P('#gc-secrets').textContent=`SECRETS ${found.size}/${sc}`;
panel.querySelectorAll('[data-u]').forEach(el=>{const c=UMAP[el.dataset.u].cost;el.classList.toggle('poor',S.honks<c)});
panel.querySelectorAll('[data-b]').forEach(el=>{const b=BMAP[el.dataset.b],c=costOf(b);el.classList.toggle('poor',S.honks<c);el.querySelector('.gc-cost').textContent=(S.amt>1?'×'+S.amt+' · ':'')+fmt(c)+' honks';el.querySelector('.gc-own').textContent=own(b.id)||'';const each=el.querySelector('.gc-each');if(each&&!el.classList.contains('locked'))each.textContent=own(b.id)?`Each makes ${fmt(unitHps(b),1)}/s · total ${fmt(unitHps(b)*own(b.id),1)}/s`:`Each makes ${fmt(unitHps(b),1)}/s`})}
function renderPane(){if(panel.hidden)return;
if(tab==='trophies'){P('#gc-trophies').innerHTML=`<p class="gc-note">${ach.size} of ${ACH.length} trophies. Each one boosts Flock Morale upgrades.</p>`+ACH.map(a=>{const got=ach.has(a.id);return`<div class="gc-trophy${got?' got':''}"><span class="gc-ic">${icon(got?'trophy':'lock')}</span><span><b>${got||!a.secret?esc(a.name):'???'}</b><em>${got||!a.secret?esc(a.desc):'A secret trophy.'}</em></span></div>`}).join('')}
else if(tab==='stats'){const rows=[['Honks in bank',fmt(S.honks)],['Honks this migration',fmt(S.run)],['All-time honks',fmt(S.all)],['Honks per second',fmt(hps(),1)],['Honks per click',fmt(clickPower(),1)],['Goose clicks',fmt(S.clicks)],['Hand-made honks',fmt(S.hand)],['Running geese caught',fmt(S.runners)],['Golden geese caught',fmt(S.golden)],['Buildings owned',fmt(B.reduce((t,b)=>t+own(b.id),0))],['Upgrades bought',bought.size+' / '+U.length],['Trophies',ach.size+' / '+ACH.length],['Secrets found',found.size+' / '+SECRETS.length],['Golden Feathers',S.feathers+' (+'+S.feathers*2+'%)'],['Migrations',S.migr],['Honking since',new Date(S.start).toLocaleDateString()],['This migration',fmtTime((Date.now()-S.runStart)/1000)]];P('#gc-stats').innerHTML=rows.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}
else if(tab==='options'){const t=featherTarget(),g=t-S.feathers;P('#gc-mig-info').innerHTML=g>=1?`Migrating now earns <b>+${g}</b> Golden Feather${g>1?'s':''}.`:`Next feather at ${fmtLong(1e9*(S.feathers+1)**3)} all-time honks.`;P('#gc-migrate').classList.toggle('poor',g<1)}}

let lastUi=0;
function ui(force){const now=performance.now();if(!force&&now-lastUi<90)return;lastUi=now;const h=hps(),bm=buffMult('prod'),cm=buffMult('click');
countEl.textContent=fmt(S.honks);rateEl.textContent=h>0?fmt(h,1)+'/s'+(bm>1?' ×'+bm:''):'';btn.classList.toggle('buffed',bm>1||cm>1);btn.setAttribute('aria-label',`Honk the goose. ${Math.floor(S.honks)} honks.`);
if(panel.hidden)return;P('#gc-honks').textContent=fmt(S.honks);P('#gc-hps').textContent=fmt(h,1)+' per second';P('#gc-click').textContent=fmt(clickPower(),1)+' per click';
const live=buffs.filter(b=>b.until>Date.now());P('#gc-buffs').innerHTML=live.map(b=>`<span>${esc(b.name)} · ${Math.ceil((b.until-Date.now())/1000)}s</span>`).join('');renderStore()}

/* ---------- news ticker */
function news(){const t=S.all,pool=['Local goose refuses to explain itself.','Scientists confirm: honk is a renewable resource.','Bread stocks up 400% on goose demand.','Geese report record satisfaction. Everyone else does not.','A goose stole a sandwich. Police have no leads, only bruises.','Breaking: goose. More at 11.','Experts recommend no fewer than 9,000 honks a day.'];
if(t<100)pool.push('You feel an urge to click the goose.','A goose is watching you. It looks disappointed.','Every honk releases another goose. That is just science.');
if(t>=1e3)pool.push('Neighbors report "a concerning amount of honking".');
if(t>=1e6)pool.push('The honk is now visible on weather radar.');
const flav={pond:'Pond levels rising. Pond is now 40% goose by volume.',farm:'Goose farm workers unionize. Demands: bread.',choir:'Honk Choir tops the charts with "HONK (Extended Mix)".',bakery:'Bakeries cannot keep up. Geese begin baking their own.',temple:'Cult of the Goose gains followers. Followers gain bruises.',mine:'Miners strike honk deep in an asteroid. It honks back.',portal:'Portal technicians report "infinite geese, infinitely annoyed".',timegoose:'The Time Goose honked before you clicked. Causality weeps.',eternal:'The Eternal Goose has left Siege of Legends to work for you. It is not happy.',honkularity:'BREAKING: the universe is now mostly goose.'};
for(const k in flav)if(own(k))pool.push(flav[k],flav[k]);
const hidden=SECRETS.filter(s=>!found.has(s.id));if(hidden.length&&t>=50)for(let i=0;i<3;i++)pool.push('RUMOR: '+pick(hidden).hint);
const sp=P('#gc-ticker span');sp.textContent=pick(pool);sp.classList.remove('in');void sp.offsetWidth;sp.classList.add('in')}

/* ---------- secrets in the lobby */
const otis=document.createElement('button');otis.type='button';otis.className='gc-otis';otis.setAttribute('aria-label','Pet Otis the dog');world.appendChild(otis);
otis.addEventListener('click',e=>{e.stopPropagation();S.pets++;bubble(rand(64,71),rand(82,86),pick(['woof','♥','*wag wag*','WOOF','♥ ♥']));beep(rand(260,340),.09,'triangle',.05);if(S.pets>=10)discover('otis')});
const duck=document.createElement('button');duck.type='button';duck.className='gc-duck';duck.tabIndex=-1;duck.setAttribute('aria-hidden','true');world.appendChild(duck);
duck.addEventListener('click',e=>{e.stopPropagation();S.duck++;const n=S.duck;bubble(96.5,86,n>=5?'HONK.':pick(['quack','quack?','...quack']));n>=5?honkSound(.8):beep(700,.05,'square',.03);if(n>=5)discover('duck')});
const KONAMI=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];let keys=[];
document.addEventListener('keydown',e=>{if(e.target.closest?.('textarea,input'))return;keys.push(e.key.length===1?e.key.toLowerCase():e.key);keys=keys.slice(-10);if(keys.join()===KONAMI.join())discover('konami');if(keys.slice(-4).join('')==='honk')discover('typed')});
new MutationObserver(()=>{const c=$('content');if(!c)return;if(c.querySelector('iframe'))discover('gamer');if(/OFFICIAL RESULTS/.test(c.textContent))discover('quiz')}).observe($('content'),{childList:true,subtree:true});

/* ---------- main loop */
let lastTick=performance.now(),sec=0,nextRunner=0,nextFlock=Date.now()+rand(5e3,15e3),nextParty=Date.now()+2e4,nextEternal=Date.now()+rand(15e3,30e3),nextNews=0;
function tick(){const now=performance.now(),dt=Math.min((now-lastTick)/1000,86400);lastTick=now;const h=hps();if(h>0)gain(h*dt);ui();
sec+=dt;if(sec<1)return;sec=0;const t=Date.now();buffs=buffs.filter(b=>b.until>t);
ACH.forEach(a=>{if(!ach.has(a.id)&&a.test()){ach.add(a.id);toast('TROPHY: '+a.name,a.desc);beep(1047,.08,'square',.03,0,false);beep(1319,.1,'square',.03,.08,false);if(tab==='trophies')renderPane()}});
if(Math.floor(S.honks)===1337)discover('leet');const hr=new Date().getHours();if(hr<4)discover('night');if(t-lastAction>600e3&&h>0&&!document.hidden)discover('patience');
if(!document.hidden){const n=B.reduce((s,b)=>s+own(b.id),0);if(t>=nextRunner){if(geese.length<3+Math.sqrt(n)*3)spawn();nextRunner=t+6000/(1+Math.sqrt(n)/2)*rand(.6,1.4)}
if(tierOn('flocks')&&t>=nextFlock){flock();nextFlock=t+rand(15e3,35e3)}
if(tierOn('party')&&t>=nextParty){party();nextParty=t+rand(25e3,45e3)}
if(tierOn('eternal')&&t>=nextEternal){eternalRise();nextEternal=t+rand(40e3,80e3)}
if(S.all>=30&&t>=nextGolden){spawnGolden();nextGolden=t+rand(90,240)*1000/goldenFreq()}
if(!panel.hidden&&t>=nextNews){news();nextNews=t+9000}}
if(!panel.hidden&&tab!=='store')renderPane()}
setInterval(tick,100);
setInterval(save,5000);addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});

/* ---------- boot */
load();applyTiers();
if(hadSave){const away=(Date.now()-S.last)/1000;if(away>60){const v=baseHps()*Math.min(away,259200)*(has('nightshift')?.75:.25);if(v>=1){gain(v);setTimeout(()=>toast('WELCOME BACK','While you were away ('+fmtTime(away)+') your flock honked '+fmt(v)+' times.','goose'),1200)}}}
ui(true);
for(let i=0;i<3;i++)setTimeout(spawn,400+i*1300);
})();
