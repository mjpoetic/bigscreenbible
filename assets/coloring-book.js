/* Original approved artwork and vector pages; all assets are bundled locally. */
(() => {
  "use strict";
  const KEY = "bsb_coloring_v1";
  const colorNames = ["Red","Rose","Orange","Yellow","Green","Teal","Sky blue","Blue","Purple","Pink","Brown","Slate","Black","White"];
  const palette = ["#e53935", "#e85d75", "#f28c45", "#f4cc4c", "#86bc66", "#329d8f", "#58b8d8", "#527bd1", "#9167b1", "#df91b6", "#ab7959", "#586174", "#111111", "#ffffff"];
  const skinTones = ["#f6dfd0","#edc7ad","#dfb18f","#ce9873","#bb815d","#a86c4b","#925536","#77432c","#5e3525","#40271e"];
  const shape = (tag, attrs, label) => ({ tag, attrs, label });
  const path = (d, label) => shape("path", { d }, label);
  const circle = (cx, cy, r, label) => shape("circle", { cx, cy, r }, label);
  const ellipse = (cx, cy, rx, ry, label, rotation = 0) => shape("ellipse", { cx, cy, rx, ry, transform: `rotate(${rotation} ${cx} ${cy})` }, label);
  const rect = (x, y, width, height, label, rx = 0) => shape("rect", { x, y, width, height, rx }, label);
  function flower(x, y, radius, count = 8) {
    return Array.from({ length: count }, (_, i) => {
      const a = i * 360 / count, radians = a * Math.PI / 180;
      return ellipse(x + Math.sin(radians) * radius, y - Math.cos(radians) * radius, radius * .43, radius * .85, `Flower petal ${i + 1}`, a);
    }).concat(circle(x, y, radius * .48, "Flower center"));
  }
  const hills = [path("M25 410 Q150 270 300 410 Q450 290 575 410 L575 575 H25 Z", "Rolling hills"), path("M25 490 Q260 355 575 510 V575 H25 Z", "Meadow")];
  const pages = [
    { id: "ark", title: "Noah’s Ark", level: "Simple", reference: "Genesis 9:12-17", shapes: [
      rect(25,25,550,550,"Sky",18), circle(485,110,48,"Sun"),
      ...[140,116,92].map((r,i)=>path(`M${300-r} 235 A${r} ${r} 0 0 1 ${300+r} 235 L${300+r-24} 235 A${r-24} ${r-24} 0 0 0 ${300-r+24} 235 Z`, `Rainbow band ${i+1}`)),
      path("M95 370 H505 L450 465 H160 Z","Ark hull"),rect(175,270,250,100,"Ark cabin"),path("M150 270 L300 195 L450 270 Z","Ark roof"),
      ...[205,280,355].map(x=>rect(x,295,40,45,"Cabin window",6)),
      path("M25 480 Q90 450 160 480 T300 480 T440 480 T575 480 V575 H25 Z","Water") ] },
    { id: "creation", title: "Creation Morning", level: "Simple", reference: "Genesis 1:20-25", shapes: [rect(25,25,550,550,"Sky",18), circle(450,130,65,"Sun"),...hills,
      rect(125,235,35,240,"Tree trunk",7),circle(140,225,95,"Tree crown"),
      ellipse(390,440,65,42,"Sheep’s wool"),ellipse(450,435,25,32,"Sheep’s face"),rect(355,466,16,48,"Left leg",5),rect(411,466,16,48,"Right leg",5),
      ellipse(320,175,38,20,"Bird’s wing",-25),ellipse(350,168,30,17,"Bird’s body"),path("M375 160 L397 169 L374 177 Z","Bird’s beak") ] },
    { id: "star", title: "The Christmas Star", level: "Simple", reference: "Matthew 2:9-11", shapes: [rect(25,25,550,550,"Night sky",18),
      path("M300 60 L325 155 L420 180 L325 205 L300 300 L275 205 L180 180 L275 155 Z","Guiding star"),
      ...[[100,100],[480,90],[110,255],[490,270]].map(([x,y])=>circle(x,y,12,"Little star")),
      ...hills,rect(190,395,220,140,"Stable"),path("M155 395 L300 300 L445 395 Z","Stable roof"),rect(265,440,70,95,"Stable doorway",30)] },
    { id: "garden", title: "Garden of Praise", level: "Detailed", reference: "Psalm 104:24", shapes: [rect(25,25,550,550,"Garden background",18),
      ...[[155,160,46],[420,165,50],[300,300,62],[145,435,45],[440,440,48]].flatMap(([x,y,r])=>flower(x,y,r)),
      ...[[85,300],[510,300],[290,90],[295,510]].flatMap(([x,y])=>[ellipse(x,y,20,45,"Garden leaf",40),ellipse(x+30,y+30,20,45,"Garden leaf",-40)])] },
    { id: "waters", title: "Beside Still Waters", level: "Detailed", reference: "Psalm 23:1-3", shapes: [rect(25,25,550,550,"Sky",18),circle(430,120,50,"Sun"),
      path("M25 335 L160 120 L300 335 Z","Left mountain"),path("M210 340 L365 165 L575 340 Z","Right mountain"),
      path("M118 187 L160 120 L204 188 L170 176 L150 195 Z","Mountain snow"),...hills,
      path("M280 360 Q450 410 310 450 Q170 505 440 575 H210 Q50 500 225 440 Q350 405 250 360 Z","Still water"),
      ...[70,490].flatMap(x=>[rect(x+25,315,18,150,"Tree trunk"),...[0,1,2].map(i=>path(`M${x-15} ${380-i*45} L${x+34} ${265-i*35} L${x+83} ${380-i*45} Z`,"Evergreen branches"))]),
      ...[[100,535],[470,520]].flatMap(([x,y])=>flower(x,y,18,6))] },
    { id: "vine", title: "The Vine and Branches", level: "Detailed", reference: "John 15:5", shapes: [rect(25,25,550,550,"Vine background",18),
      path("M285 550 Q400 420 290 300 Q190 180 300 50 L315 50 Q210 180 305 295 Q420 420 300 550 Z","Vine"),
      ...[130,270,410].flatMap((y,i)=>[ellipse(i%2?385:210,y,70,32,"Vine leaf",i%2?-30:30),ellipse(i%2?210:385,y+55,65,29,"Vine leaf",i%2?30:-30)]),
      ...[[145,245],[435,375],[180,490]].flatMap(([x,y])=>[...Array.from({length:3},(_,row)=>Array.from({length:3-row},(_,col)=>circle(x+col*27+row*13,y+row*25,17,"Grape"))).flat()])] },
  ];
  // Append details so existing saved fill indexes remain attached to their shapes.
  const cloud = (x,y) => [path(`M${x-35} ${y+12} Q${x-55} ${y-8} ${x-25} ${y-15} Q${x-15} ${y-45} ${x+10} ${y-20} Q${x+45} ${y-30} ${x+45} ${y+12} Z`, "Cloud")];
  const butterfly = (x,y) => [ellipse(x-12,y-8,12,18,"Butterfly wing",-25),ellipse(x+12,y-8,12,18,"Butterfly wing",25),ellipse(x-10,y+14,10,12,"Butterfly wing",25),ellipse(x+10,y+14,10,12,"Butterfly wing",-25),ellipse(x,y,4,21,"Butterfly body")];
  const details = {
    ark: [
      ...cloud(105,115), ...cloud(490,240),
      ...[0,1,2].flatMap(row=>Array.from({length:5-row},(_,col)=>rect(125+row*22+col*54,380+row*25,50,22,"Wooden hull plank",3))),
      ...[210,285,360].flatMap(x=>[ellipse(x+12,318,10,14,"Animal face"),ellipse(x+4,302,4,8,"Animal ear",-25),ellipse(x+20,302,4,8,"Animal ear",25),circle(x+9,316,2,"Animal eye"),circle(x+16,316,2,"Animal eye")]),
      ...Array.from({length:5},(_,i)=>path(`M${220+i*30} 258 L${230+i*30} 242 L${250+i*30} 258 Z`,"Roof tile")),
      ...[505,540].flatMap((y,row)=>Array.from({length:7},(_,i)=>ellipse(65+i*77+row*10,y,24,6,"Water ripple"))),
      ellipse(95,240,22,11,"Dove body"),ellipse(90,226,13,25,"Dove wing",-35),circle(115,234,9,"Dove head"),path("M122 232 L136 236 L122 240 Z","Dove beak"),ellipse(145,242,16,5,"Olive leaf",-25),
    ],
    creation: [
      ...cloud(300,95), ...cloud(495,260),
      ...[[90,220],[135,185],[175,230],[125,260],[175,180]].map(([x,y])=>circle(x,y,12,"Tree fruit")),
      ...[[105,170],[170,270],[95,265]].map(([x,y])=>ellipse(x,y,14,7,"Tree leaf",-25)),
      ...Array.from({length:7},(_,i)=>circle(347+i*13,421+(i%2)*13,13,"Wool curl")),
      ellipse(466,414,8,16,"Sheep ear",35),circle(457,431,3,"Sheep eye"),ellipse(462,450,7,4,"Sheep nose"),
      ...[[90,520],[200,465],[290,535],[510,520]].flatMap(([x,y])=>flower(x,y,16,6)),
      ...butterfly(270,250),...butterfly(480,340),
      ...[[280,400],[460,555],[160,540]].flatMap(([x,y])=>[ellipse(x,y,7,21,"Meadow grass",-20),ellipse(x+12,y,7,23,"Meadow grass",20)]),
    ],
    star: [
      ...[[65,180],[155,75],[445,200],[530,155],[75,330],[510,365],[385,70],[205,310]].map(([x,y])=>path(`M${x} ${y-9} L${x+3} ${y-3} L${x+9} ${y} L${x+3} ${y+3} L${x} ${y+9} L${x-3} ${y+3} L${x-9} ${y} L${x-3} ${y-3} Z`,"Twinkling star")),
      ...[0,1,2].flatMap(row=>Array.from({length:5-row},(_,i)=>rect(200+i*40+row*20,402+row*35,36,29,"Stable stone",3))).filter((_,i)=>i!==7),
      ...[0,1,2].map(i=>path(`M${190+i*35} 380 L${220+i*30} 355 L${250+i*30} 380 Z`,"Roof thatch")),
      path("M268 494 H332 L320 517 H280 Z","Manger"),ellipse(300,490,27,10,"Manger bedding"),
      ...[[80,425],[470,440]].flatMap(([x,y])=>[rect(x,y,45,40,"Bethlehem house",3),path(`M${x-5} ${y} L${x+22} ${y-24} L${x+50} ${y} Z`,"House roof"),rect(x+15,y+15,14,25,"House doorway",5)]),
      ...Array.from({length:8},(_,i)=>ellipse(60+i*65,555,18,8,"Path stone",i%2?15:-15)),
    ],
    garden: [
      ...[[155,160],[420,165],[300,300],[145,435],[440,440]].flatMap(([x,y])=>[circle(x,y,9,"Flower center jewel"),...[0,1,2,3,4,5].map(i=>circle(x+Math.cos(i*Math.PI/3)*19,y+Math.sin(i*Math.PI/3)*19,4,"Flower seed"))]),
      ...[[70,65],[525,70],[75,535],[530,535],[300,190],[300,415]].flatMap(([x,y])=>flower(x,y,16,6)),
      ...butterfly(295,75),...butterfly(70,400),...butterfly(525,220),
      ...[[200,300],[390,320],[300,540],[70,210]].flatMap(([x,y])=>[ellipse(x,y,9,23,"Small leaf",-35),ellipse(x+22,y+10,9,23,"Small leaf",35)]),
    ],
    waters: [
      ...cloud(100,85),...cloud(500,195),
      ...Array.from({length:6},(_,i)=>ellipse(265+(i%2)*25,400+i*25,18+i*2,4,"Water reflection")),
      ...[[210,370],[405,480],[180,525],[460,550]].map(([x,y])=>ellipse(x,y,16,9,"Riverbank stone",-15)),
      ...[[190,460],[400,550],[530,480]].flatMap(([x,y])=>[rect(x,y-40,4,40,"Reed stem"),ellipse(x+2,y-40,6,15,"Reed head"),ellipse(x-7,y-10,5,20,"Reed leaf",-25)]),
      ...[[110,535],[475,520]].flatMap(([x,y])=>[circle(x,y,5,"Flower seed"),ellipse(x+25,y-10,8,20,"Wildflower leaf",30)]),
      ...[[185,330],[440,350]].flatMap(([x,y])=>[ellipse(x,y,28,18,"Distant sheep"),circle(x+27,y,11,"Sheep head"),rect(x-18,y+13,7,15,"Sheep leg",2),rect(x+10,y+13,7,15,"Sheep leg",2)]),
    ],
    vine: [
      ...[130,270,410].flatMap((y,i)=>[ellipse(i%2?385:210,y,45,9,"Leaf center",i%2?-30:30),ellipse(i%2?210:385,y+55,40,8,"Leaf center",i%2?30:-30)]),
      ...[[75,90],[500,120],[95,380],[510,520]].flatMap(([x,y])=>flower(x,y,22,7)),
      ...[[145,245],[435,375],[180,490]].flatMap(([x,y])=>[ellipse(x+12,y-30,22,9,"Grape leaf",-25),circle(x+2,y-3,5,"Grape highlight"),circle(x+29,y+22,5,"Grape highlight")]),
      ...Array.from({length:10},(_,i)=>[circle(45+i*55,45,6,"Border berry"),circle(45+i*55,555,6,"Border berry")]).flat(),
      ...butterfly(450,250),
    ],
  };
  pages.forEach(p=>{p.shapes.push(...details[p.id]);p.level=["ark","creation","star"].includes(p.id)?"Detailed":"Intricate";});
  pages.unshift({id:"jesus-children",title:"Jesus Welcomes the Children",level:"Storybook",reference:"Mark 10:13-16",shapes:[],art:"./assets/coloring-pages/jesus-welcomes-children.png",regions:"./assets/coloring-pages/jesus-welcomes-children-regions.png"});
  const visiblePages=pages.filter(p=>p.art);
  const artworkData = new Map();
  let viewportObserver;
  let saved = {};
  try { const value = JSON.parse(localStorage.getItem(KEY) || "{}"); if (value && typeof value === "object" && !Array.isArray(value)) saved = value; } catch {}
  let selected = pages[0].id, color = palette[0], zoom = 1, history = [], callbacks;
  let withinLines = saved.__withinLines !== false;
  let tool = "brush", brushSize = 12, erasing = false, expanded = false;
  const ink = () => saved.__ink?.[selected];
  const validInk = value => typeof value === "string" && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value);
  const page = () => pages.find(p => p.id === selected);
  const colors = () => saved[selected] && typeof saved[selected] === "object" ? saved[selected] : {};
  const validColor = value => /^#[0-9a-f]{6}$/i.test(value || "");
  const escape = value => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  function svg(p, outline = false, interactive = false, includeInk = true, embed = false) {
    const fills = outline ? {} : saved[p.id] || {};
    if(p.art) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="${escape(p.title)} coloring page"><rect width="600" height="600" fill="white"/>${!outline && includeInk && validInk(saved.__ink?.[p.id]) ? `<image href="${saved.__ink[p.id]}" width="600" height="600"/>` : ""}<image href="${embed ? artworkData.get(p.id) : p.art}" width="600" height="600"/></svg>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="group" aria-label="${escape(p.title)} coloring page"><rect width="600" height="600" fill="white"/>${p.shapes.map((s,i)=>`<${s.tag} ${Object.entries(s.attrs).map(([k,v])=>`${k}="${escape(v)}"`).join(" ")} fill="${validColor(fills[i]) ? fills[i] : "#ffffff"}" stroke="#293241" stroke-width="3" stroke-linejoin="round" ${interactive ? `data-region="${i}" tabindex="0" role="button" aria-label="Color ${escape(s.label)}"` : ""}/>`).join("")}${!outline && includeInk && validInk(saved.__ink?.[p.id]) ? `<image href="${saved.__ink[p.id]}" width="600" height="600"/>` : ""}</svg>`;
  }
  // A Pencil often lands on an outline rather than a white pixel. Choose the
  // closest enclosed region nearby, or defer the lock until the stroke enters
  // one. A rejected first sample must never discard the whole gesture.
  function regionSeed(pixels,x,y,size=600,radius=6){
    x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=size||y>=size)return null;
    const valid=(a,b)=>{const i=(b*size+a)*4;return pixels[i+2]===127&&pixels[i+3]===255;};
    if(valid(x,y))return {x,y};
    let best=null,distance=Infinity;
    for(let dy=-Math.ceil(radius);dy<=radius;dy++)for(let dx=-Math.ceil(radius);dx<=radius;dx++){
      const a=x+dx,b=y+dy,d=dx*dx+dy*dy;if(a<0||b<0||a>=size||b>=size||d>radius*radius||d>=distance)continue;
      if(valid(a,b)){best={x:a,y:b};distance=d;}
    }
    return best;
  }
  function regionMask(pixels, x, y, size = 600) {
    x=Math.floor(x);y=Math.floor(y);
    if(x<0||x>=size||y<0||y>=size)return null;
    const offset=(y*size+x)*4,red=pixels[offset],green=pixels[offset+1];
    if(pixels[offset+2]!==127 || pixels[offset+3]!==255)return null;
    const mask=new Uint8ClampedArray(pixels.length);
    for(let i=0;i<pixels.length;i+=4) {
      if(pixels[i]===red && pixels[i+1]===green && pixels[i+2]===127 && pixels[i+3]===255)mask[i+3]=255;
    }
    return mask;
  }
  const controlGlyphs={
    brush:'<path d="m14 6 4 4M4 20c4 0 6-1 6-4a3 3 0 0 0-6 0c0 2-1 3-2 4h2Z"/><path d="m9 14 9-11a2.1 2.1 0 0 1 3 3L11 16"/>',
    fill:'<path d="m5 9 7-7 9 9-7 7a3 3 0 0 1-4 0l-5-5a3 3 0 0 1 0-4Z"/><path d="m8 3 7 7M4 11h17M20 16c0 0-2 2.6-2 4a2 2 0 0 0 4 0c0-1.4-2-4-2-4Z"/>',
    eraser:'<path d="m4 14 9-10a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-8 9H8l-4-4a2 2 0 0 1 0-3Z"/><path d="m9 9 8 8M12 21h9"/>',
    undo:'<path d="M4 10h10a6 6 0 0 1 0 12" transform="translate(0 -3)"/><path d="m8 3-4 4 4 4"/>',
    move:'<path d="M12 3v18M3 12h18m-12-6 3-3 3 3m3 3 3 3-3 3m-3 3-3 3-3-3m-3-3-3-3 3-3"/>',
    save:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    fit:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><rect x="7" y="7" width="10" height="10" rx="1"/>',
    expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    collapse:'<path d="M3 8h5V3m13 5h-5V3M3 16h5v5m13-5h-5v5"/>',
    more:'<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
  };
  function controlLabel(glyph,label){return `<svg class="coloring-tool-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${controlGlyphs[glyph]}</svg><span class="coloring-tool-label">${label}</span>`;}
  function view() {
    return `<section class="reader trivia-reader coloring-reader"><article class="trivia-panel coloring-book coloring-studio" id="coloringBook">
      <dialog class="coloring-stage" open aria-label="Coloring canvas">
      <div class="coloring-heading"><div><h1 id="coloringTitle" tabindex="-1">Coloring Book <small class="game-new-badge">BETA</small></h1><p class="coloring-page-title">${page().title}</p><p class="coloring-beta-note">More coloring pages are coming.</p></div><button type="button" class="ghost-btn" data-coloring="close">← Games menu</button></div>
      ${visiblePages.length>1 ? `<div class="coloring-pages">${visiblePages.map(p=>`<button type="button" data-page="${p.id}">${svg(p)}${p.title}</button>`).join("")}</div>` : ""}
        <div class="coloring-view-controls" aria-label="Painting controls">
          <div class="coloring-toolbar-row"><div class="coloring-tool-strip"><div class="coloring-primary-tools">
            <button class="ghost-btn" type="button" data-tool="brush" aria-pressed="${tool==='brush'}">${controlLabel("brush","Brush")}</button>
            <button class="ghost-btn" type="button" data-tool="fill" aria-pressed="${tool==='fill'}">${controlLabel("fill","Fill")}</button>
            <button class="ghost-btn" type="button" data-tool="pan" aria-pressed="${tool==='pan'}">${controlLabel("move","Move")}</button>
            <button class="ghost-btn" type="button" data-coloring="eraser" aria-pressed="${erasing}">${controlLabel("eraser","Eraser")}</button>
            <button class="ghost-btn" type="button" data-coloring="undo" ${history.length ? "" : "disabled"}>${controlLabel("undo","Undo")}</button>
            <button class="ghost-btn" type="button" data-coloring="fit">${controlLabel("fit","Fit")}</button>
            <button class="ghost-btn" type="button" data-coloring="zoom-out" aria-label="Zoom out">−</button><output id="coloringZoomLabel">${Math.round(zoom*100)}%</output><button class="ghost-btn" type="button" data-coloring="zoom-in" aria-label="Zoom in">+</button>
          </div></div><div class="coloring-secondary-tools">
            <button class="ghost-btn" type="button" data-coloring="expand" aria-label="Full screen">${controlLabel("expand","Full screen")}</button>
            <button class="ghost-btn" type="button" data-coloring="save">${controlLabel("save","Save")}</button>
            <details class="coloring-options"><summary class="ghost-btn">${controlLabel("more","More")}</summary><div class="coloring-options-body">
              <label class="coloring-line-lock"><input type="checkbox" data-within-lines ${withinLines ? "checked" : ""} /> Color within the lines</label><p class="coloring-line-help">Each stroke stays in its starting shape. Lift your finger or Pencil before coloring another shape.</p>
              <label>Brush size <input id="coloringBrushSize" type="range" min="1" max="60" value="${brushSize}" /><output id="coloringBrushValue">${brushSize}px</output></label>
              <label>Zoom <input id="coloringZoom" type="range" min="1" max="4" step=".25" value="${zoom}" /></label>
              <button class="ghost-btn" type="button" data-coloring="outline">Print outline / Save PDF</button><button class="ghost-btn" type="button" data-coloring="reset">Reset page</button>
              <button class="ghost-btn" type="button" data-coloring="games">Games menu</button><button class="ghost-btn" type="button" data-coloring="reader">Back to Bible</button>
            </div></details>
          </div></div>
          <div id="coloringPalette" class="coloring-palette" aria-label="Color palette"><label class="coloring-custom ghost-btn" title="Custom color"><input type="color" value="${color}" aria-label="Custom color" id="coloringCustom" /><span>Custom</span></label><button class="ghost-btn coloring-skin-toggle" type="button" data-coloring="skin-tones" aria-expanded="false" aria-controls="coloringSkinTones"><span class="coloring-skin-sample" aria-hidden="true"></span><span>Skin tones</span></button><div class="coloring-standard-colors">${palette.map((c,i)=>`<button type="button" data-color="${c}" style="--swatch:${c}" aria-label="${colorNames[i]}" aria-pressed="${c===color}">${c===color ? "✓" : ""}</button>`).join("")}</div></div><div id="coloringSkinTones" class="coloring-skin-tones" role="group" aria-label="Skin tones" hidden>${skinTones.map((c,i)=>`<button type="button" data-color="${c}" style="--swatch:${c}" aria-label="Skin tone ${i+1}, light to deep" aria-pressed="${c===color}">${c===color?"✓":""}</button>`).join("")}</div>
        </div>
        <div class="coloring-canvas" data-coloring-tool="${tool}" aria-label="Scrollable coloring canvas" tabindex="0"><div class="coloring-sheet" data-coloring-tool="${tool}" style="width:${zoom*100}%">${svg(page(), false, true, false)}<canvas id="coloringPixels" class="${tool === "brush" ? "is-drawing" : ""}" width="600" height="600" tabindex="0" role="group" aria-label="Coloring canvas. In Fill mode use arrow keys to move and Enter to color."></canvas><span class="coloring-keyboard-target" aria-hidden="true"></span>${page().art ? `<img class="coloring-art-lines" src="${page().art}" alt="" draggable="false" />` : ""}</div></div>
        <a class="coloring-reference" href="?reference=${encodeURIComponent(page().reference)}" data-coloring="read">Read ${page().reference} ↗</a>
        <p id="coloringStatus" role="status">Brush to color. Move to pan. Two fingers pan and zoom. Saved on this device.</p>
      </dialog></article></section>`;
  }
  function status(message) { document.getElementById("coloringStatus").textContent = message; }
  function persist() { try { localStorage.setItem(KEY,JSON.stringify(saved)); return true; } catch { return false; } }
  function refresh() { const root = document.getElementById("coloringBook"); if (!root) return; root.closest("section").outerHTML = view(); bind(callbacks); }
  function paint(region) {
    const i = Number(region.dataset.region), previous = colors()[i] || "#ffffff";
    const fillColor = erasing ? "#ffffff" : color;
    if (previous === fillColor) return;
    history.push({kind:"fill",i,previous}); if (history.length > 150) history.shift();
    saved[selected] = {...colors(),[i]:fillColor};
    region.setAttribute("fill",fillColor);
    const stored = persist();
    document.querySelector('[data-coloring="undo"]').disabled = false;
    status(stored ? "Progress saved on this device." : "Unable to save on this device. Download your artwork to keep it.");
  }
  function download(outline) {
    if(page().art && !artworkData.has(page().id)){status("Artwork is still loading. Try downloading again in a moment.");return;}
    const blob = new Blob([svg(page(), outline, false, true, true)],{type:"image/svg+xml"});
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href=url; a.download=`bible-coloring-${selected}${outline?"-outline":""}.svg`; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  let cleanupOutlinePrint=()=>{};
  async function printOutline() {
    cleanupOutlinePrint();
    if(page().art && !artworkData.has(page().id)){status("Artwork is still loading. Try printing again in a moment.");return;}
    document.getElementById("coloringPrintSheet")?.remove();
    const printSheet=document.createElement("section");printSheet.id="coloringPrintSheet";
    printSheet.innerHTML=`<h1>${page().title}</h1><p>${page().reference} · Big Screen Bible</p>${svg(page(),true,false,true,true)}`;
    document.body.append(printSheet);document.body.setAttribute("data-coloring-print","");
    const cleanup=()=>{printSheet.remove();document.body.removeAttribute("data-coloring-print");window.removeEventListener("afterprint",cleanup);document.removeEventListener("pointerdown",cleanup,true);document.removeEventListener("keydown",cleanup,true);};
    cleanupOutlinePrint=cleanup;
    window.addEventListener("afterprint",cleanup,{once:true});
    // Android resolves when its dialog opens, before the WebView is rendered.
    // Retain the print document until afterprint or the next user interaction.
    document.addEventListener("pointerdown",cleanup,{once:true,capture:true});
    document.addEventListener("keydown",cleanup,{once:true,capture:true});
    try {
      await Promise.all([...printSheet.querySelectorAll("image")].map(image=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=image.getAttribute("href");})));
      const capacitor=window.Capacitor,platform=capacitor?.getPlatform?.();
      if(["ios","android"].includes(platform)){
        if(!capacitor.isPluginAvailable?.("BSBPrint")){cleanup();status("Update the app to enable printing.");return;}
        const printer=capacitor.Plugins?.BSBPrint||capacitor.registerPlugin("BSBPrint");
        await printer.print();if(platform==="ios")cleanup();
      }else{await new Promise(requestAnimationFrame);window.print();}
    }catch{cleanup();status("Could not open printing. Please try again.");}
  }
  let inkLifecycle;
  function bind(options) {
    viewportObserver?.disconnect();
    callbacks=options;
    const root=document.getElementById("coloringBook"); if (!root) return;
    const activePage=page();
    const canvas = document.getElementById("coloringPixels"), ctx = canvas.getContext("2d");
    let drawing = null, tap = null, gesture = null, suppressFillUntil = 0, ready = !validInk(ink());
    const pointers = new Map();
    let touchGesture = false;
    const viewport = root.querySelector(".coloring-canvas");
    let drag = null;
    viewport.onpointerdown = event => {
      if (tool !== "pan" || event.pointerType === "touch" || event.button !== 0) return;
      if (viewport.scrollWidth <= viewport.clientWidth && viewport.scrollHeight <= viewport.clientHeight) return;
      event.preventDefault();
      viewport.setPointerCapture(event.pointerId);
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
      viewport.classList.add("is-panning");
    };
    viewport.onpointermove = event => {
      if (drag?.id !== event.pointerId) return;
      viewport.scrollLeft = drag.left + drag.x - event.clientX;
      viewport.scrollTop = drag.top + drag.y - event.clientY;
    };
    viewport.onlostpointercapture = event => {
      if (drag?.id !== event.pointerId) return;
      drag = null;
      viewport.classList.remove("is-panning");
    };

    let restoreGeneration=0;
    function restoreInk(){
      const generation=++restoreGeneration;
      const image=ink();ready=!validInk(image);
      if(ready){ctx.clearRect(0,0,600,600);return;}
      const img=new Image();img.onload=()=>{if(generation!==restoreGeneration)return;ctx.globalCompositeOperation="source-over";ctx.clearRect(0,0,600,600);ctx.drawImage(img,0,0);ready=true;};
      img.onerror=()=>{ready=true;status("Saved brush marks could not be loaded.");};img.src=image;
    }
    restoreInk();
    function updateUndo(){root.querySelectorAll('[data-coloring="undo"], [data-coloring="undo-expanded"]').forEach(b=>b.disabled=history.length===0);}
    function updateTool() {
      canvas.classList.toggle("is-drawing", tool === "brush");

      root.querySelector(".coloring-sheet").dataset.coloringTool=tool;viewport.dataset.coloringTool=tool;
      root.querySelectorAll("[data-tool]").forEach(b=>b.setAttribute("aria-pressed", String(b.dataset.tool === tool)));
    }
    root.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>{tool=b.dataset.tool;updateTool();});
    document.getElementById("coloringBrushSize").oninput=e=>{brushSize=Number(e.target.value);document.getElementById("coloringBrushValue").textContent=brushSize+"px";};
    function point(e) { const r=canvas.getBoundingClientRect(); return {x:(e.clientX-r.left)*600/r.width,y:(e.clientY-r.top)*600/r.height}; }
    // A region map respects paint order: nested details and foreground objects
    // cut holes out of the containing shape, so a sky stroke cannot cover them.
    const maskCanvas=document.createElement("canvas"), strokeCanvas=document.createElement("canvas");
    maskCanvas.width=strokeCanvas.width=600;maskCanvas.height=strokeCanvas.height=600;
    const maskCtx=maskCanvas.getContext("2d",{willReadFrequently:true}), strokeCtx=strokeCanvas.getContext("2d");
    let regionPixels=null;
    function readMap(){regionPixels=maskCtx.getImageData(0,0,600,600).data;}
    if(page().regions){
      const mapImage=new Image();mapImage.onload=()=>{maskCtx.drawImage(mapImage,0,0,600,600);readMap();};
      mapImage.onerror=()=>status("Line protection could not load. Reopen this page to try again.");mapImage.src=page().regions;
      const artImage=new Image();artImage.onload=()=>{const output=document.createElement("canvas");output.width=output.height=1200;output.getContext("2d").drawImage(artImage,0,0,1200,1200);artworkData.set(activePage.id,output.toDataURL("image/png"));};artImage.src=page().art;
    } else {
      // Draw native geometry directly. Safari need not rasterize an SVG data URL
      // before accepting touch or Pencil input on the vector pages.
      page().shapes.forEach((s,i)=>{
        maskCtx.save();const a=s.attrs;const rotation=/rotate\(([-.0-9]+)/.exec(a.transform || "");
        if(rotation){maskCtx.translate(a.cx,a.cy);maskCtx.rotate(Number(rotation[1])*Math.PI/180);maskCtx.translate(-a.cx,-a.cy);}
        const geometry=new Path2D();
        if(s.tag==="path")geometry.addPath(new Path2D(a.d));
        else if(s.tag==="circle")geometry.arc(a.cx,a.cy,a.r,0,Math.PI*2);
        else if(s.tag==="ellipse")geometry.ellipse(a.cx,a.cy,a.rx,a.ry,0,0,Math.PI*2);
        else if(a.rx && geometry.roundRect)geometry.roundRect(a.x,a.y,a.width,a.height,a.rx);
        else geometry.rect(a.x,a.y,a.width,a.height);
        maskCtx.fillStyle=`rgb(${(i+1)&255},${(i+1)>>8},127)`;maskCtx.strokeStyle="black";maskCtx.lineWidth=3;maskCtx.lineJoin="round";maskCtx.fill(geometry);maskCtx.stroke(geometry);maskCtx.restore();
      });readMap();
    }
    function fillAt(p){
      if(!regionPixels){status("Preparing this page. Please try again in a moment.");return;}
      const alpha=regionMask(regionPixels,p.x,p.y);if(!alpha)return;
      const offset=(Math.floor(p.y)*600+Math.floor(p.x))*4;
      if(!page().art){const i=regionPixels[offset]+(regionPixels[offset+1]<<8)-1;const region=root.querySelector(`[data-region="${i}"]`);if(region)paint(region);return;}
      const before=ink() || null, pixels=maskCtx.createImageData(600,600),hex=erasing ? "#ffffff" : color;
      const rgb=[1,3,5].map(start=>parseInt(hex.slice(start,start+2),16));
      for(let i=0;i<alpha.length;i+=4)if(alpha[i+3]){pixels.data.set(rgb,i);pixels.data[i+3]=255;}
      strokeCtx.globalCompositeOperation="source-over";strokeCtx.putImageData(pixels,0,0);ctx.globalCompositeOperation="source-over";ctx.drawImage(strokeCanvas,0,0);
      saveInk(before);
    }
    let lockedRegion=0;
    const masks=new Map();
    function startRegion(p) {
      if(!withinLines)return true;
      if(!regionPixels){status("Preparing line protection. Try again in a moment.");return false;}
      const seed=regionSeed(regionPixels,p.x,p.y,600,Math.min(8,Math.max(3,brushSize/4)));
      if(!seed)return false;
      const offset=(seed.y*600+seed.x)*4,id=regionPixels[offset]+(regionPixels[offset+1]<<8);
      if(lockedRegion===id)return true;
      let mask=masks.get(id);
      if(!mask){const alpha=regionMask(regionPixels,seed.x,seed.y);mask=maskCtx.createImageData(600,600);mask.data.set(alpha);if(masks.size>=8)masks.delete(masks.keys().next().value);masks.set(id,mask);}
      maskCtx.putImageData(mask,0,0);lockedRegion=id;return true;
    }
    root.querySelectorAll("[data-within-lines]").forEach(input=>input.onchange=()=>{
      withinLines=input.checked;saved.__withinLines=withinLines;
      root.querySelectorAll("[data-within-lines]").forEach(other=>other.checked=withinLines);
      if(!persist())status("Unable to save this preference on this device.");
    });
    function markPoints(points,e){
      if(withinLines && !drawing.maskReady){
        for(const p of points)if(startRegion(p)){drawing.maskReady=true;break;}
        if(!drawing.maskReady)return;
      }
      const target=withinLines ? strokeCtx : ctx;
      if(withinLines){strokeCtx.clearRect(0,0,600,600);strokeCtx.globalCompositeOperation="source-over";}
      target.globalCompositeOperation=!withinLines && erasing ? "destination-out" : "source-over";
      target.strokeStyle=color;target.fillStyle=color;target.lineCap="round";target.lineJoin="round";
      target.lineWidth=brushSize*(e.pointerType==="pen" && e.pressure>0 ? .35+e.pressure*.9 : 1);
      target.beginPath();target.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))target.lineTo(p.x,p.y);target.stroke();
      const end=points[points.length-1];target.beginPath();target.arc(end.x,end.y,target.lineWidth/2,0,Math.PI*2);target.fill();
      if(withinLines){strokeCtx.globalCompositeOperation="destination-in";strokeCtx.drawImage(maskCanvas,0,0);ctx.globalCompositeOperation=erasing?"destination-out":"source-over";ctx.drawImage(strokeCanvas,0,0);}
      drawing.changed=true;
      if(!checkpointTimer)checkpointTimer=setTimeout(checkpointStroke,1000);
    }
    let checkpointTimer=0;
    let strokeFrame=0,pendingPoints=[],pendingEvent;
    function flushStroke(){
      if(strokeFrame)cancelAnimationFrame(strokeFrame);strokeFrame=0;
      if(!drawing||!pendingPoints.length)return;
      markPoints([drawing.last,...pendingPoints],pendingEvent);drawing.last=pendingPoints[pendingPoints.length-1];pendingPoints=[];
    }
    function saveInk(before){
      history.push({kind:"ink",previous:before});if(history.length>30)history.shift();
      const stored=storeInk();updateUndo();
      status(stored ? "Progress saved on this device." : "Storage is full or unavailable. Download your artwork to keep it.");
    }
    function storeInk(){
      if (!saved.__ink || typeof saved.__ink !== "object") saved.__ink={};
      saved.__ink[selected]=canvas.toDataURL("image/png");
      return persist();
    }
    function checkpointStroke(){
      clearTimeout(checkpointTimer);
      checkpointTimer=0;
      if (!root.isConnected || !drawing) return;
      flushStroke();
      clearTimeout(checkpointTimer);
      checkpointTimer=0;
      if(drawing.changed){drawing.checkpointed=true;storeInk();}
    }
    const lifecycle = new AbortController();
    inkLifecycle?.abort();
    inkLifecycle=lifecycle;
    window.addEventListener("pagehide",checkpointStroke,{signal:lifecycle.signal});
    document.addEventListener("visibilitychange",()=>{
      if(document.hidden)checkpointStroke();
    },{signal:lifecycle.signal});
    function finish(e) {
      if(tap && e.pointerId===tap.id){const start=tap;tap=null;if(e.type!=="pointercancel" && tool==="fill" && Math.hypot(e.clientX-start.x,e.clientY-start.y)<10)fillAt(point(e));}
      if(!drawing || e.pointerId!==drawing.id)return;
      flushStroke();clearTimeout(checkpointTimer);checkpointTimer=0;const completed=drawing;drawing=null;pendingPoints=[];if(completed.changed)saveInk(completed.before);
    }
    function pinchState() { const [a,b]=[...pointers.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)}; }
    const sheet=root.querySelector(".coloring-sheet");
    sheet.addEventListener("pointerdown",e=>{
      if(e.pointerType!=="touch" || drawing?.pointerType==="pen")return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size!==2)return;
      touchGesture=true;
      tap=null;
      if(drawing?.pointerType==="touch"){
        // The first finger may have started a stroke before the second arrived.
        // Restore its exact starting pixels without adding an Undo entry.
        cancelAnimationFrame(strokeFrame);
        clearTimeout(checkpointTimer);
        strokeFrame=checkpointTimer=0;
        pendingPoints=[];
        ctx.putImageData(drawing.touchSnapshot,0,0);
        if(drawing.checkpointed){
          if(drawing.before)saved.__ink[activePage.id]=drawing.before;
          else delete saved.__ink[activePage.id];
          persist();
        }
        drawing=null;
      }
      gesture=pinchState();
    },true);
    sheet.addEventListener("pointermove",e=>{
      const previous=pointers.get(e.pointerId);
      if(!previous)return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(tool==="fill" && tap?.id===e.pointerId && Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>=10)tap=null;
      if((tool==="pan" || (tool==="fill" && !tap)) && pointers.size===1){
        viewport.scrollLeft+=previous.x-e.clientX;
        viewport.scrollTop+=previous.y-e.clientY;
        return;
      }
      if(pointers.size!==2 || !gesture)return;
      e.preventDefault();const next=pinchState();
      const before=zoom;setZoom(zoom*next.d/Math.max(gesture.d,1));
      const r=viewport.getBoundingClientRect(),ratio=zoom/before;
      viewport.scrollLeft=(viewport.scrollLeft+gesture.x-r.left)*ratio-(next.x-r.left);
      viewport.scrollTop=(viewport.scrollTop+gesture.y-r.top)*ratio-(next.y-r.top);
      gesture=next;
    },true);
    function releaseTouch(e){
      if(!pointers.delete(e.pointerId))return;
      if(pointers.size<2)gesture=null;
      if(touchGesture && !pointers.size){
        touchGesture=false;
        suppressFillUntil=Date.now()+700;
      }
    }
    sheet.addEventListener("pointerup",releaseTouch);sheet.addEventListener("pointercancel",releaseTouch);
    canvas.onpointerdown=e=>{
      // Safari touch/Pencil events do not consistently supply mouse button or
      // primary-pointer metadata. Only filter mouse buttons; use pointer IDs
      // to own the active stroke and allow Pencil even while a palm is present.
      if(e.pointerType==="pen" && drawing && drawing.pointerType!=="pen")finish({pointerId:drawing.id});
      if(!ready || drawing || (e.pointerType==="mouse" && e.button!==0))return;
      if(e.pointerType==="touch" && touchGesture)return;
      if(tool==="fill"){tap={id:e.pointerId,x:e.clientX,y:e.clientY};return;}
      if(tool!=="brush" || (e.pointerType!=="pen" && pointers.size>1))return;
      const p=point(e);
      e.preventDefault();try{canvas.setPointerCapture(e.pointerId);}catch{}
      drawing={id:e.pointerId,pointerType:e.pointerType,last:p,before:ink() || null,maskReady:!withinLines,changed:false,
        touchSnapshot:e.pointerType==="touch"?ctx.getImageData(0,0,canvas.width,canvas.height):null};
      markPoints([p],e);
    };
    let keyboardPoint={x:300,y:300};
    canvas.onkeydown=e=>{
      if(tool!=="fill")return;
      if(e.key==="Enter"||e.key===" "){e.preventDefault();fillAt(keyboardPoint);return;}
      const step=e.shiftKey ? 1 : 10;
      if(e.key==="ArrowLeft")keyboardPoint.x-=step;else if(e.key==="ArrowRight")keyboardPoint.x+=step;
      else if(e.key==="ArrowUp")keyboardPoint.y-=step;else if(e.key==="ArrowDown")keyboardPoint.y+=step;else return;
      e.preventDefault();keyboardPoint.x=Math.max(0,Math.min(599,keyboardPoint.x));keyboardPoint.y=Math.max(0,Math.min(599,keyboardPoint.y));
      const cursor=root.querySelector(".coloring-keyboard-target");cursor.style.left=keyboardPoint.x/6+"%";cursor.style.top=keyboardPoint.y/6+"%";
    };
    canvas.addEventListener("touchmove",e=>{if(tool==="brush" && e.cancelable)e.preventDefault();},{passive:false});
    canvas.addEventListener("contextmenu",e=>e.preventDefault());
    canvas.onpointermove=e=>{
      if(!drawing || e.pointerId!==drawing.id)return;
      e.preventDefault();const samples=e.getCoalescedEvents?.();for(const sample of samples?.length?samples:[e])pendingPoints.push(point(sample));pendingEvent=e;
      if(!strokeFrame)strokeFrame=requestAnimationFrame(flushStroke);
    };
    canvas.onpointerup=finish;canvas.onpointercancel=finish;canvas.onlostpointercapture=e=>{tap=null;if(drawing?.id===e.pointerId)finish(e);};
    root.querySelector(".coloring-sheet > svg").addEventListener("click",e=>{if(tool!=="fill")e.stopPropagation();},true);
    root.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{selected=b.dataset.page;history=[];zoom=1;refresh();});
    const skinPanel=root.querySelector("#coloringSkinTones"),skinToggle=root.querySelector('[data-coloring="skin-tones"]');
    function closeSkinTones(){skinPanel.hidden=true;skinToggle.setAttribute("aria-expanded","false");}
    function selectColor(c) { color=c; erasing=false; root.querySelectorAll('[data-coloring="eraser"], [data-coloring="erase-expanded"]').forEach(b=>b.setAttribute("aria-pressed","false")); root.querySelectorAll("[data-color]").forEach(b=>{b.setAttribute("aria-pressed",String(b.dataset.color===c));b.textContent=b.dataset.color===c?"✓":"";}); document.getElementById("coloringCustom").value=c;closeSkinTones(); }
    root.querySelectorAll("[data-color]").forEach(b=>b.onclick=()=>selectColor(b.dataset.color));
    document.getElementById("coloringCustom").oninput=e=>selectColor(e.target.value);



    root.querySelectorAll("[data-region]").forEach(r=>{r.onclick=()=>{if(tool==="fill" && !touchGesture && Date.now()>suppressFillUntil)paint(r);};r.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();paint(r);}};});
    let fitWidth=0;
    function setZoom(value) {
      zoom=Math.max(1,Math.min(4,value));
      sheet.style.width=fitWidth ? `${fitWidth*zoom}px` : `${zoom*100}%`;
      document.getElementById("coloringZoom").value=zoom;
      document.getElementById("coloringZoomLabel").textContent=Math.round(zoom*100)+"%";
    }
    document.getElementById("coloringZoom").oninput=e=>setZoom(Number(e.target.value));
    function fit() {
      fitWidth=Math.max(1,Math.min(viewport.clientWidth,viewport.clientHeight));
      setZoom(1);viewport.scrollTop=0;viewport.scrollLeft=0;
    }
    const stage=root.querySelector(".coloring-stage");
    const expandButton=root.querySelector('[data-coloring="expand"]');
    function toggleExpanded() {
      if (expanded) {
        stage.close();
        stage.setAttribute("open","");
      } else {
        stage.close();
        stage.showModal();
      }
      expanded=!expanded;
      stage.classList.toggle("is-expanded",expanded);
      const label=expanded?"Exit full screen":"Full screen";
      expandButton.innerHTML=controlLabel(expanded?"collapse":"expand",label);
      expandButton.setAttribute("aria-label",label);
      fit();
      expandButton.focus({preventScroll:true});
    }
    expanded=false;
    stage.oncancel=event=>{
      event.preventDefault();
      if(expanded)toggleExpanded();
    };
    viewportObserver=new ResizeObserver(()=>{if(zoom===1)fit();});viewportObserver.observe(viewport);
    requestAnimationFrame(()=>{if(root.isConnected)fit();});
    const more=root.querySelector(".coloring-options");
    stage.addEventListener("pointerdown",e=>{if(more.open&&!more.contains(e.target))more.open=false;if(!skinPanel.contains(e.target)&&!skinToggle.contains(e.target))closeSkinTones();},true);
    stage.onkeydown=e=>{
      if(e.key==="Escape"&&!skinPanel.hidden){e.preventDefault();e.stopPropagation();closeSkinTones();skinToggle.focus({preventScroll:true});return;}
      if(e.key==="Escape"&&more.open){e.preventDefault();e.stopPropagation();more.open=false;more.querySelector("summary").focus({preventScroll:true});return;}
      if(!expanded)return;
      if(e.key==="Escape"){e.preventDefault();e.stopPropagation();root.querySelector('[data-coloring="expand"]').click();return;}
      if(e.key!=="Tab")return;
      const controls=[...stage.querySelectorAll('button:not(:disabled),summary,a[href],select,input,[tabindex="0"]')].filter(el=>el.getBoundingClientRect().width>0);
      const first=controls[0],last=controls[controls.length-1];
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
    };
    root.querySelectorAll("[data-coloring]").forEach(b=>b.onclick=e=>{
      e.preventDefault();
      switch(b.dataset.coloring) {
        case "skin-tones": skinPanel.hidden=!skinPanel.hidden;b.setAttribute("aria-expanded",String(!skinPanel.hidden));more.open=false;break;
        case "expand": toggleExpanded();break;
        case "zoom-in": setZoom(zoom+.25);break;
        case "zoom-out": setZoom(zoom-.25);break;
        case "fit": fit();break;
        case "mode": tool=tool==="fill"?"brush":tool==="brush"?"pan":"fill";updateTool();break;
        case "games":
        case "close": if(expanded)toggleExpanded();options.close(); break;
        case "reader": if(expanded)toggleExpanded();options.reader();break;
        case "read": expanded=false;options.read(page().reference); break;
        case "save": download(false); break;
        case "outline": more.open=false;void printOutline(); break;
        case "erase-expanded":
        case "eraser": erasing=!erasing; root.querySelectorAll('[data-coloring="eraser"], [data-coloring="erase-expanded"]').forEach(b=>b.setAttribute("aria-pressed",String(erasing))); break;
        case "undo-expanded":
        case "undo": { const step=history.pop();if(!step)break;
          if(step.kind==="ink") { if(step.previous) saved.__ink[selected]=step.previous; else delete saved.__ink[selected]; }
          else saved[selected]={...colors(),[step.i]:step.previous};
          const stored=persist();if(step.kind==="ink")restoreInk();else root.querySelector(`[data-region="${step.i}"]`)?.setAttribute("fill",step.previous);updateUndo();if(!stored)status("Unable to save. Download your artwork to keep it.");break; }
        case "reset": if(window.confirm("Clear the colors on this page?")){saved[selected]={};if(saved.__ink)delete saved.__ink[selected];history=[];const stored=persist();restoreInk();updateUndo();if(!stored)status("Unable to save. Download your artwork to keep it.");} break;
      }
    });
  }
  window.BSBColoring={view,bind};
})();
