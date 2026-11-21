/* Original vector illustrations. No external artwork or network requests. */
(() => {
  "use strict";
  const KEY = "bsb_coloring_v1";
  const colorNames = ["Red","Black","Rose","Orange","Yellow","Green","Teal","Sky blue","Blue","Purple","Pink","Brown","Slate","White"];
  const palette = ["#e53935", "#111111", "#e85d75", "#f28c45", "#f4cc4c", "#86bc66", "#329d8f", "#58b8d8", "#527bd1", "#9167b1", "#df91b6", "#ab7959", "#586174", "#ffffff"];
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
  let saved = {};
  try { const value = JSON.parse(localStorage.getItem(KEY) || "{}"); if (value && typeof value === "object" && !Array.isArray(value)) saved = value; } catch {}
  let selected = pages[0].id, color = palette[0], zoom = 1, history = [], callbacks;
  let tool = "fill", brushSize = 12, erasing = false, expanded = false;
  const ink = () => saved.__ink?.[selected];
  const validInk = value => typeof value === "string" && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value);
  const page = () => pages.find(p => p.id === selected);
  const colors = () => saved[selected] && typeof saved[selected] === "object" ? saved[selected] : {};
  const validColor = value => /^#[0-9a-f]{6}$/i.test(value || "");
  const escape = value => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  function svg(p, outline = false, interactive = false, includeInk = true) {
    const fills = outline ? {} : saved[p.id] || {};
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="group" aria-label="${escape(p.title)} coloring page"><rect width="600" height="600" fill="white"/>${p.shapes.map((s,i)=>`<${s.tag} ${Object.entries(s.attrs).map(([k,v])=>`${k}="${escape(v)}"`).join(" ")} fill="${validColor(fills[i]) ? fills[i] : "#ffffff"}" stroke="#293241" stroke-width="3" stroke-linejoin="round" ${interactive ? `data-region="${i}" tabindex="0" role="button" aria-label="Color ${escape(s.label)}"` : ""}/>`).join("")}${!outline && includeInk && validInk(saved.__ink?.[p.id]) ? `<image href="${saved.__ink[p.id]}" width="600" height="600"/>` : ""}</svg>`;
  }
  function view() {
    return `<section class="reader trivia-reader is-setup"><article class="trivia-panel coloring-book" id="coloringBook">
      <div class="coloring-heading"><div><div class="trivia-eyebrow">Games · Create at your own pace</div><h1 id="coloringTitle" tabindex="-1">Bible Coloring Book <small class="game-new-badge">NEW</small></h1></div><button type="button" class="ghost-btn" data-coloring="close">← Games menu</button></div>
      <p>Choose a page and a color. Fill a shape or draw with a finger, stylus, or mouse. No timer, no scores—just room to create.</p>
      <div class="coloring-pages" aria-label="Coloring pages">${pages.map(p=>`<button type="button" data-page="${p.id}" aria-pressed="${p.id === selected}">${svg(p)}<strong>${p.title}</strong><small>${p.level} · ${p.reference}</small></button>`).join("")}</div>
      <div class="coloring-workspace"><div class="coloring-tools"><h2>${page().title}</h2><button class="text-btn" data-coloring="read" type="button">Read ${page().reference} →</button>
      <div class="coloring-actions" aria-label="Coloring mode"><button class="ghost-btn" type="button" data-tool="fill" aria-pressed="${tool==='fill'}">Fill</button><button class="ghost-btn" type="button" data-tool="brush" aria-pressed="${tool==='brush'}">Brush / pixels</button></div>
      <label>Brush size <input id="coloringBrushSize" type="range" min="1" max="60" value="${brushSize}" /><output id="coloringBrushValue">${brushSize}px</output></label>
      <button type="button" class="ghost-btn" data-coloring="eraser" aria-pressed="${erasing}">Eraser</button>
      <div class="coloring-palette" aria-label="Color palette">${palette.map((c,i)=>`<button type="button" data-color="${c}" style="--swatch:${c}" aria-label="${["Red","Black","Rose","Orange","Yellow","Green","Teal","Sky blue","Blue","Purple","Pink","Brown","Slate","White / eraser"][i]}" aria-pressed="${c===color}">${c===color ? "✓" : ""}</button>`).join("")}</div>
      <label class="coloring-custom">Custom color <input type="color" value="${color}" aria-label="Custom color" id="coloringCustom"></label>
      <div class="coloring-actions"><button class="ghost-btn" type="button" data-coloring="undo" ${history.length ? "" : "disabled"}>Undo</button><button class="ghost-btn" type="button" data-coloring="reset">Reset page</button></div>
      <label>Zoom <input id="coloringZoom" type="range" min="1" max="4" step=".25" value="${zoom}" /></label>
      <div class="coloring-actions"><button class="ghost-btn" type="button" data-coloring="save">Save artwork</button><button class="ghost-btn" type="button" data-coloring="outline">Download outline</button></div>
      <p id="coloringStatus" role="status">Progress saves on this device. Use two fingers to pan or pinch to zoom. Expand the page for more room. Download an SVG to keep or print.</p></div>
      <div class="coloring-stage ${expanded ? "is-expanded" : ""}"><div class="coloring-view-controls" aria-label="Canvas view">
      <button class="ghost-btn" type="button" data-coloring="expand">${expanded ? "Exit full screen" : "Full screen"}</button>
      <button class="ghost-btn" type="button" data-coloring="zoom-out" aria-label="Zoom out">−</button><output id="coloringZoomLabel">${Math.round(zoom*100)}%</output><button class="ghost-btn" type="button" data-coloring="zoom-in" aria-label="Zoom in">+</button>
      <button class="ghost-btn" type="button" data-coloring="fit">Fit page</button>
      <button class="ghost-btn" type="button" data-coloring="mode">${tool==="fill" ? "Fill" : "Brush"}</button><select id="coloringStandardColor" aria-label="Standard colors">${palette.map((c,i)=>`<option value="${c}" ${c===color?"selected":""}>${colorNames[i]}</option>`).join("")}</select><label class="coloring-expanded-color">Custom <input id="coloringExpandedColor" type="color" value="${color}" aria-label="Color in expanded view" /></label>
      <button class="ghost-btn coloring-fullscreen-action" type="button" data-coloring="erase-expanded">Eraser</button><button class="ghost-btn coloring-fullscreen-action" type="button" data-coloring="undo-expanded">Undo</button><select class="coloring-fullscreen-action" id="coloringExpandedSize" aria-label="Brush size in full screen">${[1,4,12,24,48,60].map(n=>`<option value="${n}" ${n===brushSize?"selected":""}>${n}px</option>`).join("")}</select><button class="ghost-btn coloring-fullscreen-action" type="button" data-coloring="save">Save artwork</button><button class="ghost-btn coloring-fullscreen-action" type="button" data-coloring="games">Games menu</button><button class="ghost-btn coloring-fullscreen-action" type="button" data-coloring="reader">Back to Bible</button>
      </div><div class="coloring-canvas" aria-label="Scrollable coloring canvas" tabindex="0"><div class="coloring-sheet" style="width:${zoom*100}%">${svg(page(), false, true, false)}<canvas id="coloringPixels" class="${tool === "brush" ? "is-drawing" : ""}" width="600" height="600" aria-label="Freehand coloring canvas. Use Fill mode for keyboard coloring."></canvas></div></div></div></div></article></section>`;
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
    const blob = new Blob([svg(page(), outline)],{type:"image/svg+xml"});
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href=url; a.download=`bible-coloring-${selected}${outline?"-outline":""}.svg`; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function bind(options) {
    callbacks=options;
    const root=document.getElementById("coloringBook"); if (!root) return;
    const canvas = document.getElementById("coloringPixels"), ctx = canvas.getContext("2d");
    let drawing = null, gesture = null, suppressFillUntil = 0, ready = !validInk(ink());
    const pointers = new Map();
    const viewport = root.querySelector(".coloring-canvas");
    if (!ready) { const img = new Image(); img.onload=()=>{ctx.drawImage(img,0,0);ready=true;}; img.onerror=()=>{ready=true;status("Saved brush marks could not be loaded.");}; img.src=ink(); }
    function updateTool() {
      canvas.classList.toggle("is-drawing", tool === "brush");
      root.querySelector('[data-coloring="mode"]').textContent=tool === "fill" ? "Fill" : "Brush";
      root.querySelectorAll("[data-tool]").forEach(b=>b.setAttribute("aria-pressed", String(b.dataset.tool === tool)));
    }
    root.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>{tool=b.dataset.tool;updateTool();});
    document.getElementById("coloringBrushSize").oninput=e=>{brushSize=Number(e.target.value);document.getElementById("coloringBrushValue").textContent=brushSize+"px";};
    function point(e) { const r=canvas.getBoundingClientRect(); return {x:(e.clientX-r.left)*600/r.width,y:(e.clientY-r.top)*600/r.height}; }
    function mark(a,b,e) {
      ctx.globalCompositeOperation=erasing ? "destination-out" : "source-over";
      ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineCap="round";ctx.lineJoin="round";
      ctx.lineWidth=brushSize*(e.pointerType === "pen" && e.pressure > 0 ? .35+e.pressure*.9 : 1);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      ctx.beginPath();ctx.arc(b.x,b.y,ctx.lineWidth/2,0,Math.PI*2);ctx.fill();
    }
    function finish(e) {
      if (!drawing || e.pointerId !== drawing.id) return;
      history.push({kind:"ink",previous:drawing.before});if(history.length>30)history.shift();
      drawing=null; ctx.globalCompositeOperation="source-over";
      if (!saved.__ink || typeof saved.__ink !== "object") saved.__ink={};
      saved.__ink[selected]=canvas.toDataURL("image/png");
      const stored=persist();root.querySelector('[data-coloring="undo"]').disabled=false;
      status(stored ? "Progress saved on this device." : "Storage is full or unavailable. Download your artwork to keep it.");
    }
    function pinchState() { const [a,b]=[...pointers.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)}; }
    const sheet=root.querySelector(".coloring-sheet");
    sheet.addEventListener("pointerdown",e=>{
      if(e.pointerType!=="touch")return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===2) { suppressFillUntil=Date.now()+700;if(drawing)finish({pointerId:drawing.id});gesture=pinchState(); }
    },true);
    sheet.addEventListener("pointermove",e=>{
      if(!pointers.has(e.pointerId))return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size!==2||!gesture)return;
      e.preventDefault();const next=pinchState();
      const before=zoom;setZoom(zoom*next.d/Math.max(gesture.d,1));
      const r=viewport.getBoundingClientRect(),ratio=zoom/before;
      viewport.scrollLeft=(viewport.scrollLeft+gesture.x-r.left)*ratio-(next.x-r.left);
      viewport.scrollTop=(viewport.scrollTop+gesture.y-r.top)*ratio-(next.y-r.top);
      gesture=next;
    },true);
    function releaseTouch(e){pointers.delete(e.pointerId);if(pointers.size<2)gesture=null;}
    sheet.addEventListener("pointerup",releaseTouch);sheet.addEventListener("pointercancel",releaseTouch);
    canvas.onpointerdown=e=>{
      if(tool!=="brush" || !ready || drawing || pointers.size>1 || e.button !== 0 || !e.isPrimary) return;
      e.preventDefault();canvas.setPointerCapture(e.pointerId);
      const p=point(e);drawing={id:e.pointerId,last:p,before:ink() || null};mark(p,p,e);
    };
    canvas.onpointermove=e=>{
      if(!drawing || e.pointerId!==drawing.id)return;
      e.preventDefault(); const samples=e.getCoalescedEvents?.();for(const sample of samples?.length ? samples : [e]) {const p=point(sample);mark(drawing.last,p,sample);drawing.last=p;}
    };
    canvas.onpointerup=finish;canvas.onpointercancel=finish;canvas.onlostpointercapture=finish;
    root.querySelector(".coloring-sheet > svg").addEventListener("click",e=>{if(tool!=="fill")e.stopPropagation();},true);
    root.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{selected=b.dataset.page;history=[];zoom=1;refresh();});
    function selectColor(c) { color=c; erasing=false; root.querySelectorAll('[data-coloring="eraser"], [data-coloring="erase-expanded"]').forEach(b=>b.setAttribute("aria-pressed","false")); root.querySelectorAll("[data-color]").forEach(b=>{b.setAttribute("aria-pressed",String(b.dataset.color===c));b.textContent=b.dataset.color===c?"✓":"";}); document.getElementById("coloringCustom").value=c;document.getElementById("coloringExpandedColor").value=c;document.getElementById("coloringStandardColor").value=c; }
    root.querySelectorAll("[data-color]").forEach(b=>b.onclick=()=>selectColor(b.dataset.color));
    document.getElementById("coloringCustom").oninput=e=>selectColor(e.target.value);
    document.getElementById("coloringExpandedColor").oninput=e=>selectColor(e.target.value);
    document.getElementById("coloringStandardColor").onchange=e=>selectColor(e.target.value);
    document.getElementById("coloringExpandedSize").onchange=e=>{brushSize=Number(e.target.value);document.getElementById("coloringBrushSize").value=brushSize;document.getElementById("coloringBrushValue").textContent=brushSize+"px";};
    root.querySelectorAll("[data-region]").forEach(r=>{r.onclick=()=>{if(tool==="fill" && Date.now()>suppressFillUntil)paint(r);};r.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();paint(r);}};});
    function setZoom(value) {
      zoom=Math.max(1,Math.min(4,value));
      sheet.style.width=`${zoom*100}%`;
      document.getElementById("coloringZoom").value=zoom;
      document.getElementById("coloringZoomLabel").textContent=Math.round(zoom*100)+"%";
    }
    document.getElementById("coloringZoom").oninput=e=>setZoom(Number(e.target.value));
    function fit() {
      setZoom(1);const size=Math.max(240,Math.min(viewport.clientWidth,viewport.clientHeight));
      sheet.style.width=size+"px";viewport.scrollTop=0;viewport.scrollLeft=0;
    }
    const stage=root.querySelector(".coloring-stage");
    function expandedState() {
      stage.setAttribute("role", expanded ? "dialog" : "region");
      stage.setAttribute("aria-label","Coloring canvas");
      if(expanded)stage.setAttribute("aria-modal","true");else stage.removeAttribute("aria-modal");
      root.querySelectorAll(".coloring-heading, .coloring-pages, .coloring-tools, :scope > p").forEach(el=>el.inert=expanded);
    }
    expandedState();
    stage.onkeydown=e=>{
      if(!expanded)return;
      if(e.key==="Escape"){e.preventDefault();e.stopPropagation();root.querySelector('[data-coloring="expand"]').click();return;}
      if(e.key!=="Tab")return;
      const controls=[...stage.querySelectorAll('button:not(:disabled),select,input,[tabindex="0"]')].filter(el=>el.getBoundingClientRect().width>0);
      const first=controls[0],last=controls[controls.length-1];
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
    };
    root.querySelectorAll("[data-coloring]").forEach(b=>b.onclick=()=>{
      switch(b.dataset.coloring) {
        case "expand": expanded=!expanded;root.querySelector(".coloring-stage").classList.toggle("is-expanded",expanded);b.textContent=expanded ? "Exit full screen" : "Full screen";expandedState();fit();b.focus();break;
        case "zoom-in": setZoom(zoom+.25);break;
        case "zoom-out": setZoom(zoom-.25);break;
        case "fit": fit();break;
        case "mode": tool=tool==="fill"?"brush":"fill";updateTool();break;
        case "games":
        case "close": expanded=false;options.close(); break;
        case "reader": expanded=false;options.reader();break;
        case "read": expanded=false;options.read(page().reference); break;
        case "save": download(false); break;
        case "outline": download(true); break;
        case "erase-expanded":
        case "eraser": erasing=!erasing; root.querySelectorAll('[data-coloring="eraser"], [data-coloring="erase-expanded"]').forEach(b=>b.setAttribute("aria-pressed",String(erasing))); break;
        case "undo-expanded":
        case "undo": { const step=history.pop();if(!step)break;
          if(step.kind==="ink") { if(step.previous) saved.__ink[selected]=step.previous; else delete saved.__ink[selected]; }
          else saved[selected]={...colors(),[step.i]:step.previous};
          const stored=persist();refresh();if(!stored)status("Unable to save. Download your artwork to keep it.");break; }
        case "reset": if(window.confirm("Clear the colors on this page?")){saved[selected]={};if(saved.__ink)delete saved.__ink[selected];history=[];const stored=persist();refresh();if(!stored)status("Unable to save. Download your artwork to keep it.");} break;
      }
    });
  }
  window.BSBColoring={view,bind};
})();
