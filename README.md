![ProtoBuf-lite.js - protobuf for JavaScript](https://raw.github.com/marchtea/ProtoBuf.js/master/ProtoBuf.png)
=====================================
Basically, This is a lite version of *ProtoBuf* by Daniel Wirtz.

For full version,please refer [ProtoBuf.js](https://github.com/dcodeIO/ProtoBuf.js)

Motivation
-----------
* parse .proto file
* create data struct which can iterate just like js support of xml
* support for different browser

Removed Features
----------------
* encode
* decode

Added Features
---------------
* add support for *IE* browsers (include IE7, IE8, IE9)

For some reasons, I need a js parser of protobuf file. After some seaching, find an awesome job done by Daneil. However, IE doesn't support for Bytes(IE9 and before), and with some code, ProtoBuf.js can't run on IE browser. 
Since no needs for encoding & decoding protobuf, I remove those function and add some code to support IE browsers.


Usage
------
Some function you may use:

```javascript
function loadPbStr(str)
{
	//deal some informal protobuf file which contains '};'
	str = str.replace(/};/g,'}');

	var ProtoBuf = dcodeIO.ProtoBuf;
	var res = new Object;
	var b = null;
	try{
		b = ProtoBuf.protoFromString(str);
		res.success = true;
		res.pbdoc = b;
	}catch(str)
	{
		res.success = false;
		res.msg = str;
	}
	return res;
}
```
```javascript
function getPbMesByDoc(pbdoc)
{
	return getPbMesByNode(pbdoc.ns);
}

function getPbMesByNode(pbnode)
{
	var messages = [];
	var child = pbnode.children;
	var tmpMes;
	for(var i = 0;i != child.length;++i)
	{
		if (child[i] instanceof dcodeIO.ProtoBuf.Reflect.Message)
		{
			messages.push(child[i]);
			tmpMes = getPbMesByNode(child[i]);
			if (tmpMes.length != 0)
			{
				messages = messages.concat(tmpMes);
			}
		}
		if (child[i] instanceof dcodeIO.ProtoBuf.Reflect.Namespace)
		{
			tmpMes = getPbMesByNode(child[i]);
			if (tmpMes.length != 0)
			{
				messages = messages.concat(tmpMes);
			}
		}
	}
	return messages;
}
```

```javascript
//change pbnode into str
function readPB(pbnode, n)
{
	var str = '';
	if (pbnode instanceof dcodeIO.ProtoBuf.Reflect.Message)
	{
		str += printSpace(n);
		if (pbnode.name.length)
		{
			str += 'message ' + pbnode.name + ' {';
		}else{
			n = n-1;
		}
		var child = pbnode.children;
		for(var i = 0;i < child.length; ++i)
		{
			if (!("id" in child[i]))//another message
			{
				str += '\n' + readPB(child[i], n+1);
			}else{
				str += '\n'+printSpace(n+1);
				if (child[i].required)
					str += 'required';
				else if (child[i].repeated)
					str += 'repeated';
				else
					str += 'optional';
				if (child[i].type.name == 'message')
				{
					str += ' ' + child[i].resolvedType.name;
				}else{
					str += ' ' + child[i].type.name;
				}
				str += ' ' + child[i].name + ' = ' + child[i].id + ';';

			}
		}
		if (pbnode.name.length)
		{
			str += '\n'+ printSpace(n) + '}\n';
		}
	}else{//is namespace
	    var child = pbnode.children;
		for(var i = 0;i < child.length; ++i)
		{
			str += readPB(child[i], n);
		}
	}
	return str;
}
```

```javascript
//change protobuf to xml
function pbDoc2Xml(pbdoc)
{
	var mes = [];
	var child = pbdoc.ns.children;
	for(var i = 0;i != child.length; ++i)
	{
		mes.push(child[i]);
	}

	for(var i=0;i != mes.length; ++i)
	{
		var insides = getInsideMessage(mes[i]);
		for(var j = 0; j != insides.length; ++j)
		{
			mes.push(insides[j]);
		}
	}
	
	var header = getPBHeader(pbdoc);
	var str = '';
	var tmpstr;
	for(var i = 0; i != mes.length; ++i)
	{
		if (mes[i] == header)
			tmpstr =  pbMessage2Xml(mes[i], true);
		else
			tmpstr =  pbMessage2Xml(mes[i]);
		if (tmpstr.length)
			str += tmpstr + '\n\n';
	}
	return str;
}

function getInsideMessage(pbnode)
{
	var mes = [];
	var child = pbnode.children;
	for(var i = 0; i != child.length; ++i)
	{
		if (!("id" in child[i]))
		{
			mes.push(child[i]);
		}
	}
	return mes;
}

function pbMessage2Xml(pbnode, isHeader)
{
	if (!(pbnode instanceof dcodeIO.ProtoBuf.Reflect.Message))
		return '';

	var str = '';
	str = '<'+pbnode.name+' '+'type="message" ';
	if (isHeader)
		str += 'proto="protobuf"';
	str += '>\n';
	var child = pbnode.children;
	for(var i = 0;i != child.length; ++i)
	{
		if ("id" in child[i])
		{
			str += printSpace(1);
			if (child[i].type.name == 'message')//is message
			{
				str += '<'+child[i].resolvedType.name+' type="message" name="'+child[i].name+'"';
			}else{
				str += '<'+child[i].type.name+ ' name="'+child[i].name+'"';
			}
			str += ' id=' + child[i].id+' ';
			if (child[i].repeated) //is array
			{
				str += ' repeated="1"';
				if (child[i].options.packed)
				{
					str += ' packed="'+child[i].options.packed+'"';
				}
			}
			if (!child[i].required && !child[i].repeated)//optional
			{
				str += ' optional="1" ';
				if (child[i].options['default'])
				{
					str += ' value="'+child[i].options['default']+'"';
				}else{
					str += ' ';
				}
			}
			str += '/>\n';

		}
	}
	str += '</'+pbnode.name+'>';
	return str;
}
```


License
-------
Apache License, Version 2.0 - http://www.apache.org/licenses/LICENSE-2.0.html
