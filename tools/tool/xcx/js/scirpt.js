$(function () {

	var swiper  = new Swiper('.swiper', {
		speed: 600,
		autoplay: {
	        delay: 3000,
	        disableOnInteraction: false,
	    },
		loop: true,
		autoplayDisableOnInteraction: false,

		// 如果需要分页器
		pagination: {
		  el: '.swiper-pagination',
		},

	})

	//解决方案
	var swiper = new Swiper('.swiper-container.s-list');
	var tabsSwiper = new Swiper('.s-list', {
//		autoplay: true,
		speed: 500,
//		autoplayDisableOnInteraction: false,
		autoHeight: true,
		on: {
			slideChangeTransitionStart: function () {
				$(".sNav .active").removeClass('active');
				$(".sNav li").eq(this.activeIndex).addClass('active');
				sNavv();
			}
		}
	})
	
//	function ulWidth() {
//		var liW = 0;
//		$(".sNav li").each(function() {
//			liW += $(".sNav li").width();
//		})
//		return liW;
//	};
	
//	var widths=0;
//	for(var i=0;i<$(".sNav li").length;i++){
//	    widths+=$(".sNav li").eq(i).width();
//	}

//  $(".sNav ul").css("width",widths);
	var slistHeight = $('.s-list .swiper-slide-active').height();
	$(".sNav li").on('click', function (e) {
		e.preventDefault()
		$(this).addClass("active").siblings().removeClass("active");
		$(window).scrollTop($('.solution').offset().top)
		var index = $(this).index();
        slistHeight = $('.s-list .swiper-slide-active').height();
		sNavv();
		tabsSwiper.slideTo($(this).index())
	})
	
	function sNavv(){
		var capLi = $(".sNav li.active").position().left - 120;
		$(".sNav").animate({scrollLeft:capLi},500);
	}
	
	$(window).scroll(function () {
    	var Wtop=$(window).scrollTop()
    	if(Wtop > $('.solution').offset().top && Wtop < ($('.solution').offset().top +$('.solution').height()+ slistHeight-200)){
            $('.solution .sNav').addClass('sNav-fixed')
		}else {$('.solution .sNav').removeClass('sNav-fixed')}

    })


});




