import re
s=open('src/shell.html').read()
s=s.replace('/*CSS*/',open('src/style.css').read())
js='\n'.join(open('src/'+f).read() for f in ['data.js','town.js','finder.js','ui.js'])
s=s.replace('/*JS*/',js)
import base64
s=s.replace('/*MUSIC*/',base64.b64encode(open('src/music.mp3','rb').read()).decode())
open('index.html','w').write(s)
print(len(s))
