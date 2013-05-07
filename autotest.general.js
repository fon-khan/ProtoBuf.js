/*
 *autotest.general.js by summerruan @2013.02
 *提供一些通用的函数
 *包括： XML读取，处理等
 *       验证输入
 */

function cleanWhitespace(element)
{
	var reg = new RegExp("\\S");
	if (element.hasChildNodes())
	{
		for(var i = 0;i < element.childNodes.length;++i)
		{
			var node = element.childNodes[i];
			if (node.nodeType == 3 && !reg.test(node.nodeValue))
			{
				node.parentNode.removeChild(node);
				--i;
			}else
				cleanWhitespace(element.childNodes[i]);
		}
	}
}

function validateXML(xmlString)
{
	if (window.ActiveXObject)
	{
		xmlDoc  = new ActiveXObject("Microsoft.XMLDOM");     
		xmlDoc.async="false";    
		xmlDoc.loadXML(xmlString);
		if(xmlDoc.parseError.errorCode!=0) 
		{
			errorMessage="错误code: " + xmlDoc.parseError.errorCode + "\n";  
			errorMessage=errorMessage+"错误原因: " + xmlDoc.parseError.reason;    
			errorMessage=errorMessage+"错误位置: " + xmlDoc.parseError.line;
			alert('xml解析错误:'+errorMessage);
			return false;
		} 
		return true;
	}else if(document.implementation.createDocument){
		var parser=new DOMParser();  
		xmlDoc = parser.parseFromString(xmlString,"text/xml");     
		var error = xmlDoc.getElementsByTagName("parsererror");    
		if (error.length > 0)     
		{  
			if(xmlDoc.documentElement.nodeName=="parsererror"){      
				errorMessage = xmlDoc.documentElement.childNodes[0].nodeValue;   
			}else{        
				errorMessage = xmlDoc.getElementsByTagName("parsererror")[0].innerText;      
			} 
			alert('xml解析错误:\n'+errorMessage);
			return false;
		}   
		return true;
	}else{
		alert('警告','不支持的浏览器');
		return false;
	}

}

function loadXMLDoc(dname){
	if (window.XMLHttpRequest)
		xhttp = new XMLHttpRequest();
	else
		xhttp = new ActiveXObject("Microsoft.XMLHTTP");
	xhttp.open("GET", dname,false);
	xhttp.send("");
	xml =  xhttp.responseXML;
	cleanWhitespace(xml);
	return xml;	
}

function loadXMLString(txt) 
{
	try //Internet Explorer
	{
		xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async="false";
		xmlDoc.loadXML(txt);
		return(xmlDoc);  
	}
	catch(e)
	{
		try //Firefox, Mozilla, Opera, etc.
		{
			parser=new DOMParser();
			xmlDoc=parser.parseFromString(txt,"text/xml");
			return(xmlDoc);
		}
		catch(e) {alert(e.message)}
	}
	return(null);
}

function printSpace(n)
{
	var str = '';
	for(var i = 0; i < n;++i)
	{
		str += '    ';
	}
	return str;
}

function newDocument()
{
	var xmlDoc;
	if (window.ActiveXObject)
	{
		xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		//		xmlDoc.async="false";
	}else{
		xmlDoc = document.implementation.createDocument('','',null);
		xmlDoc.async="false";
	}
	return xmlDoc;
}

function getXmlNodePath(node,root)
{
	if (arguments.length == 1)
	{
		root = node.ownerDocument;
	}
	var str = '';
	var parentNode;
	do{
		parentNode = node.parentNode;
		str = '/'+node.tagName+str;
		node = parentNode;
	}while(parentNode != root);
	return str;
}

function getXmlStructByDoc(xmldoc)
{
	return getXmlStructByNode(xmldoc);
}

function getXmlStructByNode(node)
{
	var structs = [];
	var child = node.childNodes;
	var tmpStructs ;
	for(var i = 0;i != child.length;++i)
	{
		if (child[i].hasChildNodes())
		{
			structs.push(child[i]);
			tmpStructs = getXmlStructByNode(child[i]);
			if (tmpStructs.length != 0)
			{
				structs = structs.concat(tmpStructs);
			}
		}
	}
	return structs;
}

function loadPbStr(str)
{
	//处理};
	str = str.replace(/};/g,'}');

	var ProtoBuf = dcodeIO.ProtoBuf;
	var res = new Object;
	var b = null;
	try{
		b = ProtoBuf.protoFromString(str);
	}catch(str)
	{
		res.success = false;
		res.msg = str;
		return res;
	}
	res.success = true;
	res.pbdoc = b;
	return res;
}

//获取ProtoBuf协议中的是协议头的部分
//判断标准： field中有Body
function getPBHeader(pcDoc)
{
	var child = pcDoc.ns.children;
	for(var i = 0; i != child.length; ++i)
	{
		var tmpChild = child[i].children;
		for(var j =0;j != tmpChild.length;++j)
		{
			if ("id" in tmpChild[j])
			{
				if (tmpChild[j].type.name == 'message' && tmpChild[j].resolvedType.name == 'MSGBODY')
				{
					return child[i];
				}
			}
		}
	}
	return null;
}

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

function readPB(pbnode, n)
{
	var str = '';
	//坑: 如果pbnode是namespace,则instanceof Reflect.Namespace && instanceof Reflect.Message都为true
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
	}else{//不是namespace就是message
		var child = pbnode.children;
		for(var i = 0;i < child.length; ++i)
		{
			str += readPB(child[i], n);
		}
	}
	return str;
}

function readTag(tag,n)
{
	var str = '';
	str += printSpace(n);
	str += '<'+tag.tagName;
	var attr = tag.attributes;
	for(var i = 0;i < attr.length; ++i)
	{
		str += ' ' + attr[i].name + '="'+attr[i].value+'"';
	}
	if (!tag.hasChildNodes())
	{
		str += '/>\n';
	}else{
		str += '>\n';
		var child = tag.childNodes;
		for(var i = 0;i< child.length;++i)
		{
			if (child[i].nodeType == 3)
				continue;
			str += readTag(child[i],n+1);
		}
		str += printSpace(n);
		str += '</'+tag.tagName+'>\n';
	}
	return str;
}

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


function getCharLenUtf8(value)
{
	var len = value.match(/[^ -~]/g) == null? value.length:value.length+value.match(/[^ -~]/g).length*2;
	return len;
}

function getCharLenGBK(value)
{
	var len = value.match(/[^ -~]/g) == null? value.length:value.length+value.match(/[^ -~]/g).length;
	return len;
}


function validateIp(str)
{
	 return /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/.test(str) ;
}

function validatePort(str)
{
	if (!/^[0-9]{1,5}$/.test(str))
		return false;
	var num = Number(str);
	if (num > 65535)
		return false;
	return true;
}

function    getArgs()   
{   
	var    args=new    Object();   
	var    query=location.search.substring(1);//获取查询串   
	var    pairs=query.split("&");//在逗号处断开   
	for(var    i=0;i<pairs.length;i++)   
	{   
		var    pos=pairs[i].indexOf('=');//查找name=value   
		if(pos==-1)    continue;//如果没有找到就跳过   
		var    argname=pairs[i].substring(0,pos);//提取name   
		var    value=pairs[i].substring(pos+1);//提取value   
		args[argname]=unescape(value);//存为属性   
	}   
	return    args;//返回对象   
}

