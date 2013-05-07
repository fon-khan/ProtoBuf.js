function basicAjax(url, callback)
{
	xmlhttp.onreadystatechange = callback;
	xmlhttp.open("GET", url,false);
	xmlhttp.send();
}


function start()
{
	basicAjax("test.proto",function(request){
		console.log(request);
	});	
}
