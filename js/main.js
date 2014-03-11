$(function () {

    var totalPage = $('.page').length - 1;
    var currentPage = 1;

    $('.time_lines').masonry({itemSelector: '.time'});

    function applyPage(currentPage) {

        $('.page').each(function (index, element) {

            if (currentPage === index) {
                $(element).addClass('active');
            } else {
                $(element).removeClass('active');
            }

        });

    }

    function navToLeft() {

        if (currentPage === 0) {
            currentPage = totalPage;
        } else {
            currentPage--
        }
        applyPage(currentPage);
    }

    function navToRight() {

        if (currentPage === totalPage) {
            currentPage = 0;
        } else {
            currentPage++;
        }
        applyPage(currentPage);
    }

    applyPage(currentPage);

    $('.navigation.left').bind('click', function () {
        navToLeft();
    });

    $('.navigation.right').bind('click', function () {
        navToRight();
    });

});
