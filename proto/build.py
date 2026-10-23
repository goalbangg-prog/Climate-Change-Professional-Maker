import json,sys
P=sys.argv[1];B=sys.argv[2]
ss=[]
for f in ['kssb-1.json','kssb-2.json']: ss+=json.load(open(f"{B}/{f}"))['sessions']
src=open(f"{P}/src.html").read()
d=json.dumps(ss,ensure_ascii=False).replace("</","<\\/")
open(f"{P}/index.html","w").write(src.replace("__DATA__",d,1))
print(len(ss),len(d))
