//這是選單
$(".menu-group").click(function(){
  $(this).toggleClass("open")
  $(".dropdown").slideToggle(500);
});

//隨機水溝蓋換圖
function showImg() {
var dd = new Date();
var seed = dd.getSeconds();
var picNum = Math.floor((Math.random(seed)*100)%5); 
var picPath = "";
switch(picNum){
	case 1:picPath="url(./img/hobbit0.png)"; break;
	case 2:picPath="url(./img/hobbit1.png)"; break;
	case 3:picPath="url(./img/hobbit2.png)"; break;
	case 4:picPath="url(./img/hobbit3.png)"; break;
}
$('.cover').css("background-image",picPath);
$('.cover').css("height",150)
$('.cover').css("top",-500)
}
function hideImg(){
	$('.cover').css("background-image","url(./img/cover.gif)");
    $('.cover').css("height",54)
    $('.cover').css("top",-415)
}