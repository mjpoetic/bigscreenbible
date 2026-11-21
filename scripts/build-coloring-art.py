"""Prepare approved line art and a closed-region hit map (requires Pillow)."""
import sys,json
from pathlib import Path
from collections import deque
from PIL import Image,ImageFilter,ImageOps
source=Path(sys.argv[1]); destination=Path(sys.argv[2])
destination.mkdir(parents=True,exist_ok=True)
gray=ImageOps.grayscale(Image.open(source)).resize((1200,1200),Image.Resampling.LANCZOS)
# White becomes transparent; preserve antialiased black contours above user ink.
lines=Image.new('RGBA',gray.size,(0,0,0,0));lines.putalpha(ImageOps.invert(gray));lines.save(destination/'jesus-welcomes-children.png',optimize=True)
small=gray.resize((600,600),Image.Resampling.LANCZOS)
barriers=small.point(lambda p:255 if p<210 else 0).filter(ImageFilter.MaxFilter(3))
blocked=bytearray(barriers.tobytes()); labels=[0]*360000; region=0;sizes=[]
for start in range(360000):
 if blocked[start]:continue
 blocked[start]=1;queue=deque([start]);component=[]
 while queue:
  p=queue.popleft();component.append(p);x=p%600;y=p//600
  for n in ([p-1] if x else [])+([p+1] if x<599 else [])+([p-600] if y else [])+([p+600] if y<599 else []):
   if not blocked[n]:blocked[n]=1;queue.append(n)
 if len(component)<12:continue
 region+=1;sizes.append(len(component))
 for p in component:labels[p]=region
rgb=bytearray(360000*3)
for i,n in enumerate(labels):
 if n:rgb[i*3:i*3+3]=bytes((n&255,n>>8,127))
Image.frombytes('RGB',(600,600),bytes(rgb)).save(destination/'jesus-welcomes-children-regions.png',optimize=True)
(destination/'jesus-welcomes-children.json').write_text(json.dumps({'width':600,'height':600,'regions':region,'minRegionPixels':12,'source':'Original AI-generated illustration approved by the project owner.','regionSizes':sizes},indent=2)+'\n')
print(f'{region} colorable regions prepared')
