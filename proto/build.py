import json,sys
P=sys.argv[1];B=sys.argv[2]
d={"kssb":[], "s2":[]}
for f in ['kssb-1.json','kssb-2.json']: d["kssb"]+=json.load(open(f"{B}/{f}"))['sessions']
d["s2"]=json.load(open(f"{B}/ifrs-s2.json"))['sessions']
src=open(f"{P}/src.html").read()
j=json.dumps(d,ensure_ascii=False).replace("</","<\\/")
open(f"{P}/index.html","w").write(src.replace("__DATA__",j,1))
print({k:len(v) for k,v in d.items()},len(j))
