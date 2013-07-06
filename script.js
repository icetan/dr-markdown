!function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i}({1:[function(require,module,exports){var Showdown,cursorToken,docTitle,editor,extend,extendA,index,initiated,markdown,model,number,proxy,restore,save,saveTimer,saved,setIndex,setMode,setToc,state,state_,toc,tocEl,updateIndex,updateTitle,updateToc,updateView,viewEl,viewWrapEl,vixen,_ref;require("./bring-the-noise.coffee");vixen=require("vixen");Showdown=require("showdown");markdown=new Showdown.converter;require("./unify.coffee");state_=require("./state.coffee");require("./state-gist.coffee");_ref=require("./utils.coffee"),number=_ref.number,index=_ref.index,toc=_ref.toc;extend=function(r,d){var k,v;if(r==null){r={}}for(k in d){v=d[k];if(v!=null){r[k]=v}}return r};extendA=function(r,a){var k,v,_i,_len,_ref1;if(r==null){r={}}for(_i=0,_len=a.length;_i<_len;_i++){_ref1=a[_i],k=_ref1[0],v=_ref1[1];if(v!=null){r[k]=v}}return r};proxy=function(dict){var def_,fn,prop,vault_;vault_={};def_=function(prop,fn){return{enumerable:true,set:function(value){var old;old=vault_[prop];vault_[prop]=value;return fn(value,old)},get:function(){return vault_[prop]}}};return Object.create(Object.prototype,extendA({toJSON:{value:function(){return vault_}}},function(){var _results;_results=[];for(prop in dict){fn=dict[prop];_results.push([prop,def_(prop,fn)])}return _results}()))};tocEl=document.getElementById("toc");viewEl=document.getElementById("view");viewWrapEl=document.getElementById("view-wrap");updateToc=function(){return tocEl.innerHTML=toc(viewEl)};updateIndex=function(){return index(number(viewEl))};setMode=function(mode){return model.mode={write:"full-input",read:"full-view"}[mode]||""};setToc=function(to){if(to){updateToc()}return model.showToc=to?"toc":""};setIndex=function(to){if(to){if(document.querySelectorAll("#view [data-number]").length===0){updateIndex();if(state.toc){updateToc()}}return model.showIndex="indexed"}else{return model.showIndex=""}};state=proxy({toc:setToc,index:setIndex,mode:setMode,theme:function(v){return model.theme=v}});docTitle=function(){var h,tmp;tmp=document.createElement("div");tmp.innerHTML=(h=viewEl.querySelectorAll("h1,h2,h3")[0])?h.innerHTML:"Untitled";[].forEach.call(tmp.querySelectorAll(".index"),function(el){return tmp.removeChild(el)});return tmp.textContent};initiated=false;saved=true;save=function(force){if(!saved||force){return state_.store(null,{text:editor.getValue(),meta:extend(state,{title:docTitle(),autosave:!force})},function(err,id){saved=err==null;return updateTitle()})}};cursorToken="^^^cursor^^^";updateView=function(){var cline,cursorHeight,cursorSpan,cursorTop,md,scrollTop,v,viewHeight;cline=editor.getCursor().line;md=editor.getValue().split("\n");md[cline]+=cursorToken;md=md.join("\n");v=viewEl;v.innerHTML=markdown.makeHtml(md).replace(cursorToken,'<span id="cursor"></span>');if(state.index){updateIndex()}if(state.toc){updateToc()}scrollTop=viewWrapEl.scrollTop;viewHeight=viewWrapEl.offsetHeight;cursorSpan=document.getElementById("cursor");cursorTop=cursorSpan.offsetTop;cursorHeight=cursorSpan.offsetHeight;if(cursorTop<scrollTop||cursorTop>scrollTop+viewHeight-cursorHeight){return viewWrapEl.scrollTop=cursorTop-viewHeight/2}};updateTitle=function(){return document.title=(saved?"":"*")+docTitle()};saveTimer=null;editor=CodeMirror.fromTextArea(document.getElementById("input-md"),{mode:"gfm",theme:"default",lineNumbers:false,lineWrapping:true,dragDrop:false});editor.on("change",function(){updateView();if(initiated){if(saved){saved=false;updateTitle()}clearTimeout(saveTimer);return saveTimer=setTimeout(save,5e3)}else{return updateTitle()}});restore=function(data){var currentText,meta,text;currentText=editor.getValue();if(data){text=data.text,meta=data.meta;extend(state,meta||{});if(text!=null&&text!==currentText){editor.setValue(text)}}else if(currentText){save(true)}model.theme=state.theme||"serif";return initiated=true};model={show:function(v){if(v){return""}else{return"hide"}},hide:function(v){if(v){return"hide"}else{return""}},noop:function(e){e.preventDefault();return false},stop:function(e){e.stopPropagation();return false},drop:function(e){var reader;reader=new FileReader;reader.onload=function(e){initiated=true;return editor.setValue(e.target.result)};return reader.readAsText(e.dataTransfer.files[0])},settings:function(){return model.showSettings=true},stores:Object.keys(state_.stores).map(function(key){return{name:key}}),themes:["serif","cv"].map(function(name){return{name:name,click:function(){return state.theme=name}}}),showSettings:false,print:function(){return window.print()},mode:"",toggleToc:function(){return state.toc=!state.toc},toggleIndex:function(){return state.index=!state.index},expandInput:function(){return state.mode=state.mode?"":"write"},expandView:function(){return state.mode=state.mode?"":"read"},closePopups:function(){return model.showSettings=false},mouseout:function(e){var from;from=e.relatedTarget||e.toElement;if(!from||from.nodeName==="HTML"){return save()}},hotkey:function(e){if(e.ctrlKey){if(e.altKey){switch(e.keyCode){case 24:return state.mode="write";case 3:return state.mode="";case 22:return state.mode="read"}}else{switch(e.keyCode){case 19:return save(true)}}}}};state_.restore(null,null,function(err,data){return restore(data)});state_.on("restore",function(data){initiated=false;return restore(data)});vixen(document.body.parentNode,model)},{"./bring-the-noise.coffee":2,"./unify.coffee":3,"./state.coffee":4,"./state-gist.coffee":5,"./utils.coffee":6,vixen:7,showdown:8}],7:[function(require,module,exports){!function(obj){if(typeof module!=="undefined")module.exports=obj;else window.vixen=obj}(function(){function trim(str){return String.prototype.trim.call(str)}function resolveProp(obj,name){return name.trim().split(".").reduce(function(p,prop){return p?p[prop]:undefined},obj)}function resolveChain(obj,chain){var prop=chain.shift();return chain.reduce(function(p,prop){var f=resolveProp(obj,prop);return f?f(p):p},resolveProp(obj,prop))}function bucket(b,k,v){if(!(k in b))b[k]=[];if(!(v in b[k]))b[k].push(v)}function extend(orig,obj){Object.keys(obj).forEach(function(prop){orig[prop]=obj[prop]});return orig}function traverseElements(el,callback){var i;if(callback(el)!==false){for(i=el.children.length;i--;)!function(node){traverseElements(node,callback)}(el.children[i])}}function createProxy(maps,proxy){proxy=proxy||{};proxy.extend=function(obj){var toRender={};Object.keys(obj).forEach(function(prop){maps.orig[prop]=obj[prop];if(maps.binds[prop])maps.binds[prop].forEach(function(renderId){if(renderId>=0)toRender[renderId]=true})});for(renderId in toRender)maps.renders[renderId](maps.orig);return proxy};Object.keys(maps.binds).forEach(function(prop){var ids=maps.binds[prop];Object.defineProperty(proxy,prop,{set:function(value){maps.orig[prop]=value;ids.forEach(function(renderId){if(renderId>=0)maps.renders[renderId](maps.orig)})},get:function(){if(maps.rebinds[prop])return maps.rebinds[prop]();return maps.orig[prop]}})});return proxy}return function(el,model){var pattern=/\{\{.+?\}\}/g,pipe="|";function resolve(orig,prop){if(!orig)return"";var val=resolveChain(orig,prop.slice(2,-2).split(pipe));return val===undefined?"":val}function strTmpl(str,orig){return str.replace(pattern,resolve.bind(undefined,orig))}function match(str){var m=str.match(pattern);if(m)return m.map(function(chain){return chain.slice(2,-2).split(pipe).map(trim)})}function traverse(el,orig){var binds={},rebinds={},renders={},count=0;orig=orig||{};function bindRenders(chains,renderId){chains.forEach(function(chain){bucket(binds,chain[0].split(".")[0],renderId)})}function parseIterator(el){var marker,prefix="",nodes=[];if(parent_=el.parentElement||el.parentNode){if(el.tagName==="FOR"){marker=el.ownerDocument.createTextNode("");parent_.replaceChild(marker,el)}else if(el.getAttribute("data-in")){prefix="data-";parent_=el;nodes=Array.prototype.slice.call(el.childNodes);marker=el.ownerDocument.createTextNode("");parent_.appendChild(marker)}else return;return{alias:el.getAttribute(prefix+"value"),key:el.getAttribute(prefix+"key"),prop:el.getAttribute(prefix+"in"),each:el.getAttribute(prefix+"each"),nodes:nodes,parent:parent_,marker:marker}}}function mapAttribute(owner,attr){var name,eventId,renderId,str,noTmpl;if((str=attr.value)&&(chains=match(str))){name=attr.name;if(name.indexOf("vx-")===0){owner.removeAttribute(name);name=name.substr(3)}if(name.indexOf("on")===0){renderId=-1;eventName=name.substr(2);chains.forEach(function(chain){owner.addEventListener(eventName,function(evt){return resolveProp(orig,chain[0])(evt,owner.value)})});owner.removeAttribute(name)}else{noTmpl=chains.length===1&&str.substr(0,1)==="{"&&str.substr(-1)==="}";renderId=count++;(renders[renderId]=function(orig,clear){var val=noTmpl?resolve(orig,str):strTmpl(str,orig);!clear&&name in owner?owner[name]=val:owner.setAttribute(name,val)})(orig,true);if(noTmpl)rebinds[chains[0][0]]=function(){return name in owner?owner[name]:owner.getAttribute(name)}}bindRenders(chains,renderId)}}function mapTextNodes(el){for(var i=el.childNodes.length;i--;)!function(node){var str,renderId,chains;if(node.nodeType===el.TEXT_NODE&&(str=node.nodeValue)&&(chains=match(str))){renderId=count++;(renders[renderId]=function(orig){node.nodeValue=strTmpl(str,orig)})(orig);bindRenders(chains,renderId)}}(el.childNodes[i])}el.removeAttribute("data-subview");traverseElements(el,function(el_){var i,iter,template,nodes,renderId;if(el_.getAttribute("data-subview")!==null)return false;if(iter=parseIterator(el_)){nodes=iter.nodes;template=el_.cloneNode(true);maps=traverse(template.cloneNode(true));renderId=count++;(renders[renderId]=function(orig){var list=resolveProp(orig,iter.prop),each_=iter.each&&resolveProp(orig,iter.each),i;for(i=nodes.length;i--;)iter.parent.removeChild(nodes[i]);nodes=[];for(i in list)if(list.hasOwnProperty(i))!function(value,i){var orig_=extend({},orig),clone=template.cloneNode(true),lastNode=iter.marker,maps,renderId,i_,node,nodes_=[];if(iter.key)orig_[iter.key]=i;orig_[iter.alias]=value;maps=traverse(clone,orig_);for(i_=clone.childNodes.length;i_--;lastNode=node){nodes_.push(node=clone.childNodes[i_]);iter.parent.insertBefore(node,lastNode)}if(each_&&each_(value,i,orig_,nodes_.filter(function(n){return n.nodeType===el_.ELEMENT_NODE}))!=null){for(i_=nodes_.length;i_--;)iter.parent.removeChild(nodes_[i_])}else{nodes=nodes.concat(nodes_)}}(list[i],i)})(orig);bucket(binds,iter.prop.split(".")[0],renderId);for(p in maps.binds)if(iter.alias.indexOf(p)===-1)bucket(binds,p,renderId)}else{mapTextNodes(el_)}if(el_.tagName!=="FOR")for(i=el_.attributes.length;i--;)mapAttribute(el_,el_.attributes[i]);return!iter});return{orig:orig,binds:binds,rebinds:rebinds,renders:renders}}return createProxy(traverse(el,model&&extend({},model)),model)}}())},{}],8:[function(require,module,exports){!function(){var Showdown={};Showdown.converter=function(){var g_urls;var g_titles;var g_html_blocks;var g_list_level=0;this.makeHtml=function(text){g_urls=new Array;g_titles=new Array;g_html_blocks=new Array;text=text.replace(/~/g,"~T");text=text.replace(/\$/g,"~D");text=text.replace(/\r\n/g,"\n");text=text.replace(/\r/g,"\n");text="\n\n"+text+"\n\n";text=_Detab(text);text=text.replace(/^[ \t]+$/gm,"");text=_DoGithubCodeBlocks(text);text=_HashHTMLBlocks(text);text=_StripLinkDefinitions(text);text=_RunBlockGamut(text);text=_UnescapeSpecialChars(text);text=text.replace(/~D/g,"$$");text=text.replace(/~T/g,"~");return text};var _StripLinkDefinitions=function(text){var text=text.replace(/^[ ]{0,3}\[(.+)\]:[ \t]*\n?[ \t]*<?(\S+?)>?[ \t]*\n?[ \t]*(?:(\n*)["(](.+?)[")][ \t]*)?(?:\n+|\Z)/gm,function(wholeMatch,m1,m2,m3,m4){m1=m1.toLowerCase();g_urls[m1]=_EncodeAmpsAndAngles(m2);if(m3){return m3+m4}else if(m4){g_titles[m1]=m4.replace(/"/g,"&quot;")}return""});return text};var _HashHTMLBlocks=function(text){text=text.replace(/\n/g,"\n\n");var block_tags_a="p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del|style|section|header|footer|nav|article|aside";var block_tags_b="p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|style|section|header|footer|nav|article|aside";text=text.replace(/^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del)\b[^\r]*?\n<\/\2>[ \t]*(?=\n+))/gm,hashElement);text=text.replace(/^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|style|section|header|footer|nav|article|aside)\b[^\r]*?.*<\/\2>[ \t]*(?=\n+)\n)/gm,hashElement);text=text.replace(/(\n[ ]{0,3}(<(hr)\b([^<>])*?\/?>)[ \t]*(?=\n{2,}))/g,hashElement);text=text.replace(/(\n\n[ ]{0,3}<!(--[^\r]*?--\s*)+>[ \t]*(?=\n{2,}))/g,hashElement);text=text.replace(/(?:\n\n)([ ]{0,3}(?:<([?%])[^\r]*?\2>)[ \t]*(?=\n{2,}))/g,hashElement);text=text.replace(/\n\n/g,"\n");return text};var hashElement=function(wholeMatch,m1){var blockText=m1;blockText=blockText.replace(/\n\n/g,"\n");blockText=blockText.replace(/^\n/,"");blockText=blockText.replace(/\n+$/g,"");blockText="\n\n~K"+(g_html_blocks.push(blockText)-1)+"K\n\n";return blockText};var _RunBlockGamut=function(text){text=_DoHeaders(text);var key=hashBlock("<hr />");text=text.replace(/^[ ]{0,2}([ ]?\*[ ]?){3,}[ \t]*$/gm,key);text=text.replace(/^[ ]{0,2}([ ]?\-[ ]?){3,}[ \t]*$/gm,key);text=text.replace(/^[ ]{0,2}([ ]?\_[ ]?){3,}[ \t]*$/gm,key);text=_DoLists(text);text=_DoCodeBlocks(text);text=_DoBlockQuotes(text);text=_HashHTMLBlocks(text);text=_FormParagraphs(text);return text};var _RunSpanGamut=function(text){text=_DoCodeSpans(text);text=_EscapeSpecialCharsWithinTagAttributes(text);text=_EncodeBackslashEscapes(text);text=_DoImages(text);text=_DoAnchors(text);text=_DoAutoLinks(text);text=_EncodeAmpsAndAngles(text);text=_DoItalicsAndBold(text);text=text.replace(/  +\n/g," <br />\n");return text};var _EscapeSpecialCharsWithinTagAttributes=function(text){var regex=/(<[a-z\/!$]("[^"]*"|'[^']*'|[^'">])*>|<!(--.*?--\s*)+>)/gi;text=text.replace(regex,function(wholeMatch){var tag=wholeMatch.replace(/(.)<\/?code>(?=.)/g,"$1`");tag=escapeCharacters(tag,"\\`*_");return tag});return text};var _DoAnchors=function(text){text=text.replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\][ ]?(?:\n[ ]*)?\[(.*?)\])()()()()/g,writeAnchorTag);text=text.replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\]\([ \t]*()<?(.*?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g,writeAnchorTag);text=text.replace(/(\[([^\[\]]+)\])()()()()()/g,writeAnchorTag);return text};var writeAnchorTag=function(wholeMatch,m1,m2,m3,m4,m5,m6,m7){if(m7==undefined)m7="";var whole_match=m1;var link_text=m2;var link_id=m3.toLowerCase();var url=m4;var title=m7;if(url==""){if(link_id==""){link_id=link_text.toLowerCase().replace(/ ?\n/g," ")}url="#"+link_id;if(g_urls[link_id]!=undefined){url=g_urls[link_id];if(g_titles[link_id]!=undefined){title=g_titles[link_id]}}else{if(whole_match.search(/\(\s*\)$/m)>-1){url=""}else{return whole_match}}}url=escapeCharacters(url,"*_");var result='<a href="'+url+'"';if(title!=""){title=title.replace(/"/g,"&quot;");title=escapeCharacters(title,"*_");result+=' title="'+title+'"'}result+=">"+link_text+"</a>";return result};var _DoImages=function(text){text=text.replace(/(!\[(.*?)\][ ]?(?:\n[ ]*)?\[(.*?)\])()()()()/g,writeImageTag);text=text.replace(/(!\[(.*?)\]\s?\([ \t]*()<?(\S+?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g,writeImageTag);return text};var writeImageTag=function(wholeMatch,m1,m2,m3,m4,m5,m6,m7){var whole_match=m1;var alt_text=m2;var link_id=m3.toLowerCase();var url=m4;var title=m7;if(!title)title="";if(url==""){if(link_id==""){link_id=alt_text.toLowerCase().replace(/ ?\n/g," ")}url="#"+link_id;if(g_urls[link_id]!=undefined){url=g_urls[link_id];if(g_titles[link_id]!=undefined){title=g_titles[link_id]}}else{return whole_match}}alt_text=alt_text.replace(/"/g,"&quot;");url=escapeCharacters(url,"*_");var result='<img src="'+url+'" alt="'+alt_text+'"';title=title.replace(/"/g,"&quot;");title=escapeCharacters(title,"*_");result+=' title="'+title+'"';result+=" />";return result};var _DoHeaders=function(text){text=text.replace(/^(.+)[ \t]*\n=+[ \t]*\n+/gm,function(wholeMatch,m1){return hashBlock('<h1 id="'+headerId(m1)+'">'+_RunSpanGamut(m1)+"</h1>")});text=text.replace(/^(.+)[ \t]*\n-+[ \t]*\n+/gm,function(matchFound,m1){return hashBlock('<h2 id="'+headerId(m1)+'">'+_RunSpanGamut(m1)+"</h2>")});text=text.replace(/^(\#{1,6})[ \t]*(.+?)[ \t]*\#*\n+/gm,function(wholeMatch,m1,m2){var h_level=m1.length;return hashBlock("<h"+h_level+' id="'+headerId(m2)+'">'+_RunSpanGamut(m2)+"</h"+h_level+">")});function headerId(m){return m.replace(/[^\w]/g,"").toLowerCase()}return text};var _ProcessListItems;var _DoLists=function(text){text+="~0";var whole_list=/^(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm;if(g_list_level){text=text.replace(whole_list,function(wholeMatch,m1,m2){var list=m1;var list_type=m2.search(/[*+-]/g)>-1?"ul":"ol";list=list.replace(/\n{2,}/g,"\n\n\n");var result=_ProcessListItems(list);result=result.replace(/\s+$/,"");result="<"+list_type+">"+result+"</"+list_type+">\n";return result})}else{whole_list=/(\n\n|^\n?)(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/g;text=text.replace(whole_list,function(wholeMatch,m1,m2,m3){var runup=m1;var list=m2;var list_type=m3.search(/[*+-]/g)>-1?"ul":"ol";var list=list.replace(/\n{2,}/g,"\n\n\n");var result=_ProcessListItems(list);result=runup+"<"+list_type+">\n"+result+"</"+list_type+">\n";return result})}text=text.replace(/~0/,"");return text};_ProcessListItems=function(list_str){g_list_level++;list_str=list_str.replace(/\n{2,}$/,"\n");list_str+="~0";list_str=list_str.replace(/(\n)?(^[ \t]*)([*+-]|\d+[.])[ \t]+([^\r]+?(\n{1,2}))(?=\n*(~0|\2([*+-]|\d+[.])[ \t]+))/gm,function(wholeMatch,m1,m2,m3,m4){var item=m4;var leading_line=m1;var leading_space=m2;if(leading_line||item.search(/\n{2,}/)>-1){item=_RunBlockGamut(_Outdent(item))}else{item=_DoLists(_Outdent(item));item=item.replace(/\n$/,"");item=_RunSpanGamut(item)}return"<li>"+item+"</li>\n"});list_str=list_str.replace(/~0/g,"");g_list_level--;return list_str};var _DoCodeBlocks=function(text){text+="~0";text=text.replace(/(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=~0))/g,function(wholeMatch,m1,m2){var codeblock=m1;var nextChar=m2;codeblock=_EncodeCode(_Outdent(codeblock));codeblock=_Detab(codeblock);codeblock=codeblock.replace(/^\n+/g,"");codeblock=codeblock.replace(/\n+$/g,"");codeblock="<pre><code>"+codeblock+"\n</code></pre>";return hashBlock(codeblock)+nextChar});text=text.replace(/~0/,"");return text};var _DoGithubCodeBlocks=function(text){text+="~0";text=text.replace(/(?:^|\n)```(.*)\n([\s\S]*?)\n```/g,function(wholeMatch,m1,m2){var language=m1;var codeblock=m2;codeblock=_EncodeCode(codeblock);codeblock=_Detab(codeblock);codeblock=codeblock.replace(/^\n+/g,"");codeblock=codeblock.replace(/\n+$/g,"");codeblock="<pre><code"+(language?' class="'+language+'"':"")+">"+codeblock+"\n</code></pre>";return hashBlock(codeblock)});text=text.replace(/~0/,"");return text};var hashBlock=function(text){text=text.replace(/(^\n+|\n+$)/g,"");return"\n\n~K"+(g_html_blocks.push(text)-1)+"K\n\n"};var _DoCodeSpans=function(text){text=text.replace(/(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm,function(wholeMatch,m1,m2,m3,m4){var c=m3;c=c.replace(/^([ \t]*)/g,"");c=c.replace(/[ \t]*$/g,"");c=_EncodeCode(c);return m1+"<code>"+c+"</code>"});return text};var _EncodeCode=function(text){text=text.replace(/&/g,"&amp;");text=text.replace(/</g,"&lt;");text=text.replace(/>/g,"&gt;");text=escapeCharacters(text,"*_{}[]\\",false);return text};var _DoItalicsAndBold=function(text){text=text.replace(/(\*\*|__)(?=\S)([^\r]*?\S[*_]*)\1/g,"<strong>$2</strong>");text=text.replace(/(\*|_)(?=\S)([^\r]*?\S)\1/g,"<em>$2</em>");return text};var _DoBlockQuotes=function(text){text=text.replace(/((^[ \t]*>[ \t]?.+\n(.+\n)*\n*)+)/gm,function(wholeMatch,m1){var bq=m1;bq=bq.replace(/^[ \t]*>[ \t]?/gm,"~0");bq=bq.replace(/~0/g,"");bq=bq.replace(/^[ \t]+$/gm,"");bq=_RunBlockGamut(bq);bq=bq.replace(/(^|\n)/g,"$1  ");bq=bq.replace(/(\s*<pre>[^\r]+?<\/pre>)/gm,function(wholeMatch,m1){var pre=m1;pre=pre.replace(/^  /gm,"~0");pre=pre.replace(/~0/g,"");return pre});return hashBlock("<blockquote>\n"+bq+"\n</blockquote>")});return text};var _FormParagraphs=function(text){text=text.replace(/^\n+/g,"");text=text.replace(/\n+$/g,"");var grafs=text.split(/\n{2,}/g);var grafsOut=new Array;var end=grafs.length;for(var i=0;i<end;i++){var str=grafs[i];if(str.search(/~K(\d+)K/g)>=0){grafsOut.push(str)}else if(str.search(/\S/)>=0){str=_RunSpanGamut(str);str=str.replace(/^([ \t]*)/g,"<p>");str+="</p>";grafsOut.push(str)}}end=grafsOut.length;for(var i=0;i<end;i++){while(grafsOut[i].search(/~K(\d+)K/)>=0){var blockText=g_html_blocks[RegExp.$1];blockText=blockText.replace(/\$/g,"$$$$");grafsOut[i]=grafsOut[i].replace(/~K\d+K/,blockText)}}return grafsOut.join("\n\n")};var _EncodeAmpsAndAngles=function(text){text=text.replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g,"&amp;");text=text.replace(/<(?![a-z\/?\$!])/gi,"&lt;");return text};var _EncodeBackslashEscapes=function(text){text=text.replace(/\\(\\)/g,escapeCharacters_callback);text=text.replace(/\\([`*_{}\[\]()>#+-.!])/g,escapeCharacters_callback);return text};var _DoAutoLinks=function(text){text=text.replace(/<((https?|ftp|dict):[^'">\s]+)>/gi,'<a href="$1">$1</a>');text=text.replace(/<(?:mailto:)?([-.\w]+\@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)>/gi,function(wholeMatch,m1){return _EncodeEmailAddress(_UnescapeSpecialChars(m1))});return text};var _EncodeEmailAddress=function(addr){function char2hex(ch){var hexDigits="0123456789ABCDEF";var dec=ch.charCodeAt(0);return hexDigits.charAt(dec>>4)+hexDigits.charAt(dec&15)}var encode=[function(ch){return"&#"+ch.charCodeAt(0)+";"},function(ch){return"&#x"+char2hex(ch)+";"},function(ch){return ch}];addr="mailto:"+addr;addr=addr.replace(/./g,function(ch){if(ch=="@"){ch=encode[Math.floor(Math.random()*2)](ch)}else if(ch!=":"){var r=Math.random();ch=r>.9?encode[2](ch):r>.45?encode[1](ch):encode[0](ch)}return ch});addr='<a href="'+addr+'">'+addr+"</a>";addr=addr.replace(/">.+:/g,'">');return addr};var _UnescapeSpecialChars=function(text){text=text.replace(/~E(\d+)E/g,function(wholeMatch,m1){var charCodeToReplace=parseInt(m1);return String.fromCharCode(charCodeToReplace)});return text};var _Outdent=function(text){text=text.replace(/^(\t|[ ]{1,4})/gm,"~0");text=text.replace(/~0/g,"");return text};var _Detab=function(text){text=text.replace(/\t(?=\t)/g,"    ");text=text.replace(/\t/g,"~A~B");text=text.replace(/~B(.+?)~A/g,function(wholeMatch,m1,m2){var leadingText=m1;var numSpaces=4-leadingText.length%4;for(var i=0;i<numSpaces;i++)leadingText+=" ";return leadingText});text=text.replace(/~A/g,"    ");text=text.replace(/~B/g,"");return text};var escapeCharacters=function(text,charsToEscape,afterBackslash){var regexString="(["+charsToEscape.replace(/([\[\]\\])/g,"\\$1")+"])";if(afterBackslash){regexString="\\\\"+regexString}var regex=new RegExp(regexString,"g");text=text.replace(regex,escapeCharacters_callback);return text};var escapeCharacters_callback=function(wholeMatch,m1){var charCodeToEscape=m1.charCodeAt(0);return"~E"+charCodeToEscape+"E"}};if(typeof module!=="undefined")module.exports=Showdown}()},{}],3:[function(require,module,exports){var map,unify;map={"<=":"⇐","=>":"⇒","<=>":"⇔","<-":"←","->":"→","<->":"↔","...":"…","--":"–","---":"—","^1":"¹","^2":"²","^3":"³","1/2":"½","1/4":"¼","3/4":"¾"};unify=function(cm){var m,pos,token;pos=cm.getCursor();m=/[^\s]+$/.exec(cm.getRange({line:pos.line,ch:0},pos));token=m!=null?m[0]:void 0;if(token!=null&&map[token]!=null){return cm.replaceRange(map[token],{line:pos.line,ch:pos.ch-token.length},pos)}};CodeMirror.commands["unify"]=unify;CodeMirror.keyMap["default"]["Ctrl-Space"]="unify"},{}],6:[function(require,module,exports){module.exports={getCursorPosition:function(el){var Sel,SelLength,pos;pos=0;if(document.selection){el.focus();Sel=document.selection.createRange();SelLength=document.selection.createRange().text.length;Sel.moveStart("character",-el.value.length);pos=Sel.text.length-SelLength}else if(el.selectionStart||el.selectionStart===0){pos=el.selectionStart}return pos},number:function(el){var count,elems,h,i,map,n,num,order,reset,sel,selector,t,_i,_j,_k,_len,_len1,_len2,_ref,_ref1;selector="H1,H2,H3,H4,H5,H6";elems=[];order=selector.split(",");map={};for(i=_i=0,_len=order.length;_i<_len;i=++_i){sel=order[i];map[sel]={c:0,pos:i}}num=function(tag){var c,t;return function(){var _j,_ref,_results;_results=[];for(i=_j=0,_ref=map[tag].pos;0<=_ref?_j<=_ref:_j>=_ref;i=0<=_ref?++_j:--_j){if((c=map[t=order[i]].c)!==0&&t!=="OL"&&t!=="UL"){_results.push(c)}}return _results}().join(",")};count=function(sel){var e,_j,_ref,_ref1,_results;e=map[sel];e.c++;_results=[];for(i=_j=_ref=e.pos+1,_ref1=order.length;_ref<=_ref1?_j<_ref1:_j>_ref1;i=_ref<=_ref1?++_j:--_j){_results.push(map[order[i]].c=0)}return _results};reset=function(clear){var obj,_results;if(clear){elems=[]}_results=[];for(sel in map){obj=map[sel];_results.push(obj.c=0)}return _results};_ref=el.querySelectorAll("[data-number-reset],[data-number-clear],"+selector);for(i=_j=0,_len1=_ref.length;_j<_len1;i=++_j){h=_ref[i];if(h.hasAttribute("data-number-reset")){reset()}else if(h.hasAttribute("data-number-clear")){reset(true)}else{t=h.tagName;count(t);if(t!=="OL"&&t!=="UL"){elems.push([h,num(t)])}}}for(_k=0,_len2=elems.length;_k<_len2;_k++){_ref1=elems[_k],h=_ref1[0],n=_ref1[1];h.setAttribute("data-number",n)}return el},index:function(el){var e,_i,_len,_ref;_ref=el.querySelectorAll("[data-number]");for(_i=0,_len=_ref.length;_i<_len;_i++){e=_ref[_i];e.innerHTML='<span class="index">\n'+e.getAttribute("data-number").split(",").join(". ")+".\n</span>"+e.innerHTML}return el},toc:function(el){var e;return"<ul>"+function(){var _i,_len,_ref,_results;_ref=el.querySelectorAll("H1,H2,H3,H4,H5,H6");_results=[];for(_i=0,_len=_ref.length;_i<_len;_i++){e=_ref[_i];_results.push('<li><a href="#'+e.id+'"><'+e.tagName+">\n"+e.innerHTML+"\n</"+e.tagName+"></a></li>")}return _results}().join("")+"</ul>"}}},{}],9:[function(require,module,exports){var process=module.exports={};process.nextTick=function(){var canSetImmediate=typeof window!=="undefined"&&window.setImmediate;var canPost=typeof window!=="undefined"&&window.postMessage&&window.addEventListener;if(canSetImmediate){return function(f){return window.setImmediate(f)}}if(canPost){var queue=[];window.addEventListener("message",function(ev){if(ev.source===window&&ev.data==="process-tick"){ev.stopPropagation();if(queue.length>0){var fn=queue.shift();fn()}}},true);return function nextTick(fn){queue.push(fn);window.postMessage("process-tick","*")}}return function nextTick(fn){setTimeout(fn,0)}}();process.title="browser";process.browser=true;process.env={};process.argv=[];process.binding=function(name){throw new Error("process.binding is not supported")};process.cwd=function(){return"/"};process.chdir=function(dir){throw new Error("process.chdir is not supported")}},{}],10:[function(require,module,exports){!function(process){if(!process.EventEmitter)process.EventEmitter=function(){};var EventEmitter=exports.EventEmitter=process.EventEmitter;var isArray=typeof Array.isArray==="function"?Array.isArray:function(xs){return Object.prototype.toString.call(xs)==="[object Array]"};function indexOf(xs,x){if(xs.indexOf)return xs.indexOf(x);for(var i=0;i<xs.length;i++){if(x===xs[i])return i}return-1}var defaultMaxListeners=10;EventEmitter.prototype.setMaxListeners=function(n){if(!this._events)this._events={};this._events.maxListeners=n};EventEmitter.prototype.emit=function(type){if(type==="error"){if(!this._events||!this._events.error||isArray(this._events.error)&&!this._events.error.length){if(arguments[1]instanceof Error){throw arguments[1]}else{throw new Error("Uncaught, unspecified 'error' event.")}return false}}if(!this._events)return false;var handler=this._events[type];if(!handler)return false;if(typeof handler=="function"){switch(arguments.length){case 1:handler.call(this);break;case 2:handler.call(this,arguments[1]);break;case 3:handler.call(this,arguments[1],arguments[2]);break;default:var args=Array.prototype.slice.call(arguments,1);handler.apply(this,args)}return true}else if(isArray(handler)){var args=Array.prototype.slice.call(arguments,1);var listeners=handler.slice();for(var i=0,l=listeners.length;i<l;i++){listeners[i].apply(this,args)}return true}else{return false}};EventEmitter.prototype.addListener=function(type,listener){if("function"!==typeof listener){throw new Error("addListener only takes instances of Function")}if(!this._events)this._events={};this.emit("newListener",type,listener);if(!this._events[type]){this._events[type]=listener}else if(isArray(this._events[type])){if(!this._events[type].warned){var m;if(this._events.maxListeners!==undefined){m=this._events.maxListeners}else{m=defaultMaxListeners}if(m&&m>0&&this._events[type].length>m){this._events[type].warned=true;console.error("(node) warning: possible EventEmitter memory "+"leak detected. %d listeners added. "+"Use emitter.setMaxListeners() to increase limit.",this._events[type].length);console.trace()}}this._events[type].push(listener)}else{this._events[type]=[this._events[type],listener]}return this};EventEmitter.prototype.on=EventEmitter.prototype.addListener;EventEmitter.prototype.once=function(type,listener){var self=this;self.on(type,function g(){self.removeListener(type,g);listener.apply(this,arguments)});return this};EventEmitter.prototype.removeListener=function(type,listener){if("function"!==typeof listener){throw new Error("removeListener only takes instances of Function")}if(!this._events||!this._events[type])return this;var list=this._events[type];if(isArray(list)){var i=indexOf(list,listener);if(i<0)return this;list.splice(i,1);if(list.length==0)delete this._events[type]}else if(this._events[type]===listener){delete this._events[type]}return this};EventEmitter.prototype.removeAllListeners=function(type){if(arguments.length===0){this._events={};return this}if(type&&this._events&&this._events[type])this._events[type]=null;return this};EventEmitter.prototype.listeners=function(type){if(!this._events)this._events={};if(!this._events[type])this._events[type]=[];if(!isArray(this._events[type])){this._events[type]=[this._events[type]]}return this._events[type]}}(require("__browserify_process"))},{__browserify_process:9}],5:[function(require,module,exports){var state,xhr;xhr=require("./xhr.coffee");state=require("./state.coffee");state.stores.gist={store:function(id,data,callback){if(data.meta.autosave){return callback("Auto save not supported.")}return xhr.json({method:"POST",url:"https://api.github.com/gists",data:{description:"Created with Dr. Markdown",files:{"document.md":{content:data.text},"meta.json":{content:JSON.stringify(data.meta)}}}},function(err,data){return callback(err,data.id)})},restore:function(id,callback){return xhr.json({url:"https://api.github.com/gists/"+id},function(err,data){var meta,text,_ref,_ref1,_ref2;_ref=data.files,_ref1=_ref["document.md"],text=_ref1.content,_ref2=_ref["meta.json"],meta=_ref2.content;return callback(err,{text:text,meta:JSON.parse(meta)})})}}},{"./xhr.coffee":11,"./state.coffee":4}],2:[function(require,module,exports){var addStyle,noise;noise=require("../lib/noise");addStyle=function(css){var style;style=document.createElement("style");style.type="text/css";style.innerHTML=css;return document.getElementsByTagName("head")[0].appendChild(style)};addStyle(".noise { background-image: url("+noise(128,128,[0,0,0,0],[0,0,0,8])+"); }")},{"../lib/noise":12}],4:[function(require,module,exports){var EventEmitter,base64,deserialize,pad,rnd,serialize,state;
EventEmitter=require("events").EventEmitter;base64=require("../lib/base64");pad=function(n,p){return new Array(p+1-n.toString().length).join("0")+n};rnd=function(){return Date.now().toString(16)+pad((Math.random()*65536|0).toString(16),4)};deserialize=function(){var id,type,_ref;_ref=window.location.hash.substr(1).split("/"),type=_ref[0],id=_ref[1];return{type:type,id:id}};serialize=function(data){return window.location.hash="#"+data.type+(data.id?"/"+data.id:"")};module.exports=state=new EventEmitter;state.storeType="base64";state.storeId=void 0;state.stores={base64:{store:function(id,data,callback){return callback(null,base64.encode(JSON.stringify(data||"{}")))},restore:function(id,callback){return callback(null,JSON.parse(base64.decode(id)||"{}"))}},local:{store:function(id,data,callback){if(id==null){id=rnd()}window.localStorage.setItem("markdown-"+id,JSON.stringify(data||"{}"));return callback(null,id)},restore:function(id,callback){return callback(null,JSON.parse(window.localStorage.getItem("markdown-"+id)||"{}"))}},file:{store:function(id,data,callback){if(data.meta.autosave){return callback("Auto save not supported.")}saveAs(new Blob([data.text],{type:"text/plain;charset=utf-8"}),data.meta.title+".md");return callback()},restore:function(id,callback){return callback(null,{text:"",meta:{}})}}};state.store=function(storeType,data,callback){if(storeType){state.storeType=storeType}return state.stores[state.storeType].store(state.storeId,data,function(err,storeId){if(err!=null){return typeof callback==="function"?callback(err):void 0}state.storeId=storeId;serialize({type:state.storeType,id:storeId});return typeof callback==="function"?callback(null,storeId):void 0})};state.restore=function(storeType,storeId,callback){var _ref;if(storeType==null&&storeId==null){_ref=deserialize(),storeType=_ref.type,storeId=_ref.id}if(storeType){state.storeType=storeType}state.storeId=storeId;if(storeId!=null){return state.stores[state.storeType].restore(state.storeId,function(err,data){return callback(err,data)})}else{return callback()}};window.addEventListener("hashchange",function(){var storeId,storeType,_ref;_ref=deserialize(),storeType=_ref.type,storeId=_ref.id;if(storeType!==state.storeType||storeId!==state.storeId){return state.restore(storeType,storeId,function(err,data){if(err==null){return state.emit("restore",data)}})}})},{events:10,"../lib/base64":13}],11:[function(require,module,exports){var xhr;xhr=function(opt,callback){var header,method,r,value,_ref;method=opt.method||"GET";r=new XMLHttpRequest;if("withCredentials"in r){r.open(method,opt.url,true)}else if(typeof XDomainRequest!=="undefined"&&XDomainRequest!==null){r=new XDomainRequest;r.open(method,opt.url)}else{return null}r.onreadystatechange=function(){if(r.readyState===4){if(r.status>=200&&r.status<300){return callback(void 0,r.responseText,r)}else{return callback(r.statusText,r.responseText,r)}}};_ref=opt.headers;for(header in _ref){value=_ref[header];r.setRequestHeader(header,value)}r.send(opt.data);return r};xhr.json=function(opt,callback){var callback_;callback_=function(err,json,xhr){var data,err_;if(err!=null||!json){return callback(err,void 0,xhr)}try{data=JSON.parse(json)}catch(_error){err_=_error;err=err_}return callback(err,data,xhr)};opt.data=JSON.stringify(opt.data);opt.headers={"Content-Type":"application/json"};return xhr(opt,callback_)};module.exports=xhr},{}],12:[function(require,module,exports){var BYTE4=4294967296;module.exports=function(w,h,min,span){var canvas=document.createElement("canvas"),ctx=canvas.getContext("2d"),i,j,imageData,rnd;if(!(min instanceof Array))min=[min,min,min,255];else for(;min.length<4;min.push(min.length===3?255:min[min.length-1]));if(!(span instanceof Array))span=[span,span,span,255];else for(;span.length<4;span.push(span.length===3?255:span[span.length-1]));canvas.width=w;canvas.height=h;imageData=ctx.createImageData(canvas.width,canvas.height);for(i=imageData.data.length;(i-=4)>=0;){rnd=Math.random()*BYTE4;for(j=0;j<4;j++)imageData.data[i+j]=span[j]?((rnd>>j*8&255)/255*span[j]|0)+min[j]:min[j]}ctx.putImageData(imageData,0,0);return canvas.toDataURL()}},{}],13:[function(require,module,exports){var base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(input){var output="";var chr1,chr2,chr3,enc1,enc2,enc3,enc4;var i=0;input=base64._utf8_encode(input);while(i<input.length){chr1=input.charCodeAt(i++);chr2=input.charCodeAt(i++);chr3=input.charCodeAt(i++);enc1=chr1>>2;enc2=(chr1&3)<<4|chr2>>4;enc3=(chr2&15)<<2|chr3>>6;enc4=chr3&63;if(isNaN(chr2)){enc3=enc4=64}else if(isNaN(chr3)){enc4=64}output=output+this._keyStr.charAt(enc1)+this._keyStr.charAt(enc2)+this._keyStr.charAt(enc3)+this._keyStr.charAt(enc4)}return output},decode:function(input){var output="";var chr1,chr2,chr3;var enc1,enc2,enc3,enc4;var i=0;input=input.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(i<input.length){enc1=this._keyStr.indexOf(input.charAt(i++));enc2=this._keyStr.indexOf(input.charAt(i++));enc3=this._keyStr.indexOf(input.charAt(i++));enc4=this._keyStr.indexOf(input.charAt(i++));chr1=enc1<<2|enc2>>4;chr2=(enc2&15)<<4|enc3>>2;chr3=(enc3&3)<<6|enc4;output=output+String.fromCharCode(chr1);if(enc3!=64){output=output+String.fromCharCode(chr2)}if(enc4!=64){output=output+String.fromCharCode(chr3)}}output=base64._utf8_decode(output);return output},_utf8_encode:function(string){string=string.replace(/\r\n/g,"\n");var utftext="";for(var n=0;n<string.length;n++){var c=string.charCodeAt(n);if(c<128){utftext+=String.fromCharCode(c)}else if(c>127&&c<2048){utftext+=String.fromCharCode(c>>6|192);utftext+=String.fromCharCode(c&63|128)}else{utftext+=String.fromCharCode(c>>12|224);utftext+=String.fromCharCode(c>>6&63|128);utftext+=String.fromCharCode(c&63|128)}}return utftext},_utf8_decode:function(utftext){var string="";var i=0;var c=c1=c2=0;while(i<utftext.length){c=utftext.charCodeAt(i);if(c<128){string+=String.fromCharCode(c);i++}else if(c>191&&c<224){c2=utftext.charCodeAt(i+1);string+=String.fromCharCode((c&31)<<6|c2&63);i+=2}else{c2=utftext.charCodeAt(i+1);c3=utftext.charCodeAt(i+2);string+=String.fromCharCode((c&15)<<12|(c2&63)<<6|c3&63);i+=3}}return string}};module.exports=base64},{}]},{},[1]);